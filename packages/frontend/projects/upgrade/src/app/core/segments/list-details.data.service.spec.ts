import { firstValueFrom, of } from 'rxjs';
import { EXPERIMENT_STATE, LIST_FILTER_MODE, SEGMENT_TYPE } from 'upgrade_types';
import { ExperimentDataService } from '../experiments/experiments.data.service';
import { FeatureFlagsDataService } from '../feature-flags/feature-flags.data.service';
import { ListDetailsDataService } from './list-details.data.service';
import { SegmentsDataService } from './segments.data.service';
import { EditPrivateSegmentListDetails, LIST_OWNER_TYPE, Segment } from './store/segments.model';

describe('ListDetailsDataService', () => {
  let service: ListDetailsDataService;
  let experimentDataService: { [key: string]: jest.Mock };
  let featureFlagsDataService: { [key: string]: jest.Mock };
  let segmentsDataService: { [key: string]: jest.Mock };

  const segment = {
    id: 'list-id',
    name: 'Test list',
    description: '',
    context: 'test',
    type: SEGMENT_TYPE.PRIVATE,
    listType: 'Individual',
  } as Segment;

  const referencedSegment = {
    id: 'referenced-segment-id',
    name: 'Referenced segment',
    type: SEGMENT_TYPE.PUBLIC,
  } as Segment;

  const segmentBackedList = {
    ...segment,
    listType: 'Segment',
    subSegments: [referencedSegment],
  } as Segment;

  const segmentRequest: EditPrivateSegmentListDetails = {
    id: segment.id,
    name: segment.name,
    description: segment.description,
    context: segment.context,
    type: SEGMENT_TYPE.PRIVATE,
    userIds: ['one'],
    groups: [],
    subSegmentIds: [],
    listType: 'Individual',
  };

  beforeEach(() => {
    experimentDataService = {
      getExperimentById: jest.fn(),
      updateInclusionList: jest.fn(),
      updateExclusionList: jest.fn(),
      deleteInclusionList: jest.fn(),
      deleteExclusionList: jest.fn(),
    };
    featureFlagsDataService = {
      fetchFeatureFlagById: jest.fn(),
      updateInclusionList: jest.fn(),
      updateExclusionList: jest.fn(),
      deleteInclusionList: jest.fn(),
      deleteExclusionList: jest.fn(),
    };
    segmentsDataService = {
      fetchSegmentWithMembersById: jest.fn(),
      getSegmentById: jest.fn(),
      updateSegmentList: jest.fn(),
      deleteSegmentList: jest.fn(),
    };

    service = new ListDetailsDataService(
      experimentDataService as unknown as ExperimentDataService,
      featureFlagsDataService as unknown as FeatureFlagsDataService,
      segmentsDataService as unknown as SegmentsDataService
    );
  });

  it('loads a feature flag owner and preserves the include-list enabled state and list type', (done) => {
    featureFlagsDataService.fetchFeatureFlagById.mockReturnValue(
      of({
        id: 'flag-id',
        name: 'Test flag',
        featureFlagSegmentInclusion: [{ segment, enabled: true, listType: 'Individual' }],
        featureFlagSegmentExclusion: [],
      })
    );

    service
      .fetchOwner(LIST_OWNER_TYPE.FEATURE_FLAG, 'flag-id', LIST_FILTER_MODE.INCLUSION, segment.id)
      .subscribe((owner) => {
        expect(owner).toEqual({
          id: 'flag-id',
          name: 'Test flag',
          type: LIST_OWNER_TYPE.FEATURE_FLAG,
          listEnabled: true,
          listType: 'Individual',
        });
        done();
      });
  });

  it('loads an experiment owner with the inferred owner-side list type', (done) => {
    experimentDataService.getExperimentById.mockReturnValue(
      of({
        id: 'experiment-id',
        name: 'Test experiment',
        state: EXPERIMENT_STATE.ENROLLING,
        // The experiment response carries the (possibly inferred) list type even when
        // the list's own segment row predates the listType column.
        experimentSegmentInclusion: [{ segment: { ...segment, listType: 'Individual' } }],
        experimentSegmentExclusion: [],
      })
    );

    service
      .fetchOwner(LIST_OWNER_TYPE.EXPERIMENT, 'experiment-id', LIST_FILTER_MODE.INCLUSION, segment.id)
      .subscribe((owner) => {
        expect(owner).toEqual({
          id: 'experiment-id',
          name: 'Test experiment',
          type: LIST_OWNER_TYPE.EXPERIMENT,
          listType: 'Individual',
          isReadOnly: false,
        });
        done();
      });
  });

  it('marks completed and archived experiment owners as read-only', (done) => {
    experimentDataService.getExperimentById.mockReturnValue(
      of({
        id: 'experiment-id',
        name: 'Test experiment',
        state: EXPERIMENT_STATE.COMPLETED,
        experimentSegmentInclusion: [],
        experimentSegmentExclusion: [{ segment }],
      })
    );

    service
      .fetchOwner(LIST_OWNER_TYPE.EXPERIMENT, 'experiment-id', LIST_FILTER_MODE.EXCLUSION, segment.id)
      .subscribe((owner) => {
        expect(owner.isReadOnly).toBe(true);
        expect(owner.listType).toBe(segment.listType);
        done();
      });
  });

  it('rejects an experiment list that is not attached to the requested owner and filter mode', async () => {
    experimentDataService.getExperimentById.mockReturnValue(
      of({
        id: 'experiment-id',
        name: 'Test experiment',
        state: EXPERIMENT_STATE.ENROLLING,
        experimentSegmentInclusion: [],
        experimentSegmentExclusion: [{ segment }],
      })
    );

    await expect(
      firstValueFrom(
        service.fetchListDetails(LIST_OWNER_TYPE.EXPERIMENT, 'experiment-id', LIST_FILTER_MODE.INCLUSION, segment.id)
      )
    ).rejects.toThrow(`List ${segment.id} does not belong to owner experiment-id.`);
    expect(segmentsDataService.fetchSegmentWithMembersById).not.toHaveBeenCalled();
  });

  it('rejects a feature flag list that is not attached to the requested owner', async () => {
    featureFlagsDataService.fetchFeatureFlagById.mockReturnValue(
      of({
        id: 'flag-id',
        name: 'Test flag',
        featureFlagSegmentInclusion: [],
        featureFlagSegmentExclusion: [],
      })
    );

    await expect(
      firstValueFrom(
        service.fetchOwner(LIST_OWNER_TYPE.FEATURE_FLAG, 'flag-id', LIST_FILTER_MODE.INCLUSION, segment.id)
      )
    ).rejects.toThrow(`List ${segment.id} does not belong to owner flag-id.`);
  });

  it('rejects a nested list that is not attached to the requested segment', async () => {
    segmentsDataService.getSegmentById.mockReturnValue(
      of({ segment: { id: 'parent-id', name: 'Parent segment', subSegments: [] } })
    );

    await expect(
      firstValueFrom(service.fetchOwner(LIST_OWNER_TYPE.SEGMENT, 'parent-id', LIST_FILTER_MODE.EXCLUSION, segment.id))
    ).rejects.toThrow(`List ${segment.id} does not belong to owner parent-id.`);
  });

  it('rejects an inclusion URL for a nested segment list', async () => {
    segmentsDataService.getSegmentById.mockReturnValue(
      of({ segment: { id: 'parent-id', name: 'Parent segment', subSegments: [segment] } })
    );

    await expect(
      firstValueFrom(service.fetchOwner(LIST_OWNER_TYPE.SEGMENT, 'parent-id', LIST_FILTER_MODE.INCLUSION, segment.id))
    ).rejects.toThrow(`List ${segment.id} does not belong to owner parent-id for ${LIST_FILTER_MODE.INCLUSION}.`);
  });

  it('rejects a Segment-backed experiment list before loading its members', async () => {
    experimentDataService.getExperimentById.mockReturnValue(
      of({
        id: 'experiment-id',
        name: 'Test experiment',
        state: EXPERIMENT_STATE.ENROLLING,
        experimentSegmentInclusion: [{ segment: segmentBackedList }],
        experimentSegmentExclusion: [],
      })
    );

    await expect(
      firstValueFrom(
        service.fetchListDetails(
          LIST_OWNER_TYPE.EXPERIMENT,
          'experiment-id',
          LIST_FILTER_MODE.INCLUSION,
          segmentBackedList.id
        )
      )
    ).rejects.toThrow(`Segment-backed list ${segmentBackedList.id} cannot be opened in List Details.`);
    expect(segmentsDataService.fetchSegmentWithMembersById).not.toHaveBeenCalled();
  });

  it('rejects a Segment-backed feature flag list before loading its members', async () => {
    featureFlagsDataService.fetchFeatureFlagById.mockReturnValue(
      of({
        id: 'flag-id',
        name: 'Test flag',
        featureFlagSegmentInclusion: [{ segment: segmentBackedList, enabled: true, listType: 'Segment' }],
        featureFlagSegmentExclusion: [],
      })
    );

    await expect(
      firstValueFrom(
        service.fetchListDetails(
          LIST_OWNER_TYPE.FEATURE_FLAG,
          'flag-id',
          LIST_FILTER_MODE.INCLUSION,
          segmentBackedList.id
        )
      )
    ).rejects.toThrow(`Segment-backed list ${segmentBackedList.id} cannot be opened in List Details.`);
    expect(segmentsDataService.fetchSegmentWithMembersById).not.toHaveBeenCalled();
  });

  it('rejects a Segment-backed nested list before loading its members', async () => {
    segmentsDataService.getSegmentById.mockReturnValue(
      of({ segment: { id: 'parent-id', name: 'Parent segment', subSegments: [segmentBackedList] } })
    );

    await expect(
      firstValueFrom(
        service.fetchListDetails(LIST_OWNER_TYPE.SEGMENT, 'parent-id', LIST_FILTER_MODE.EXCLUSION, segmentBackedList.id)
      )
    ).rejects.toThrow(`Segment-backed list ${segmentBackedList.id} cannot be opened in List Details.`);
    expect(segmentsDataService.fetchSegmentWithMembersById).not.toHaveBeenCalled();
  });

  it('rejects a legacy Segment-backed list inferred from its subsegment relationship', async () => {
    const legacySegmentBackedList = { ...segmentBackedList, listType: undefined };
    experimentDataService.getExperimentById.mockReturnValue(
      of({
        id: 'experiment-id',
        name: 'Test experiment',
        state: EXPERIMENT_STATE.ENROLLING,
        experimentSegmentInclusion: [{ segment: legacySegmentBackedList }],
        experimentSegmentExclusion: [],
      })
    );
    segmentsDataService.fetchSegmentWithMembersById.mockReturnValue(of(legacySegmentBackedList));

    await expect(
      firstValueFrom(
        service.fetchListDetails(
          LIST_OWNER_TYPE.EXPERIMENT,
          'experiment-id',
          LIST_FILTER_MODE.INCLUSION,
          legacySegmentBackedList.id
        )
      )
    ).rejects.toThrow(`Segment-backed list ${legacySegmentBackedList.id} cannot be opened in List Details.`);
  });

  it('uses the experiment inclusion endpoint with the existing full-list payload', (done) => {
    experimentDataService.updateInclusionList.mockReturnValue(of({ segment }));

    service
      .updateList(
        LIST_OWNER_TYPE.EXPERIMENT,
        LIST_FILTER_MODE.INCLUSION,
        'experiment-id',
        false,
        'Individual',
        segmentRequest
      )
      .subscribe((result) => {
        expect(experimentDataService.updateInclusionList).toHaveBeenCalledWith({
          experimentId: 'experiment-id',
          list: { ...segmentRequest, listType: 'Individual' },
        });
        expect(result).toBe(segment);
        done();
      });
  });

  it('preserves feature flag list status when updating values', (done) => {
    featureFlagsDataService.updateExclusionList.mockReturnValue(of({ segment }));

    service
      .updateList(
        LIST_OWNER_TYPE.FEATURE_FLAG,
        LIST_FILTER_MODE.EXCLUSION,
        'flag-id',
        true,
        'Individual',
        segmentRequest
      )
      .subscribe(() => {
        expect(featureFlagsDataService.updateExclusionList).toHaveBeenCalledWith({
          id: 'flag-id',
          enabled: true,
          listType: 'Individual',
          segment: segmentRequest,
        });
        done();
      });
  });

  it('deletes a nested segment list with its parent segment id', (done) => {
    segmentsDataService.deleteSegmentList.mockReturnValue(of(undefined));

    service.deleteList(LIST_OWNER_TYPE.SEGMENT, LIST_FILTER_MODE.EXCLUSION, 'parent-id', segment.id).subscribe(() => {
      expect(segmentsDataService.deleteSegmentList).toHaveBeenCalledWith(segment.id, 'parent-id');
      done();
    });
  });

  it('deletes an experiment list with its owner id', (done) => {
    experimentDataService.deleteInclusionList.mockReturnValue(of(undefined));

    service
      .deleteList(LIST_OWNER_TYPE.EXPERIMENT, LIST_FILTER_MODE.INCLUSION, 'experiment-id', segment.id)
      .subscribe(() => {
        expect(experimentDataService.deleteInclusionList).toHaveBeenCalledWith(segment.id);
        done();
      });
  });

  it('deletes a feature flag list with its owner id', (done) => {
    featureFlagsDataService.deleteExclusionList.mockReturnValue(of(undefined));

    service
      .deleteList(LIST_OWNER_TYPE.FEATURE_FLAG, LIST_FILTER_MODE.EXCLUSION, 'flag-id', segment.id)
      .subscribe(() => {
        expect(featureFlagsDataService.deleteExclusionList).toHaveBeenCalledWith(segment.id);
        done();
      });
  });
});
