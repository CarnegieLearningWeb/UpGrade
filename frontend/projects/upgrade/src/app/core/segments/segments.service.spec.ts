import { fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { SEGMENT_TYPE } from 'upgrade_types';
import { SegmentsService } from './segments.service';
import {
  actionDeleteSegment,
  actionExportSegments,
  actionImportSegments,
  actionUpsertSegment,
} from './store/segments.actions';
import { SegmentInput, UpsertSegmentType } from './store/segments.model';
import * as SegmentSelectors from './store/segments.selectors';
const MockStateStore$ = new BehaviorSubject({});
(MockStateStore$ as any).dispatch = jest.fn();

describe('SegmentService', () => {
  let mockStore: any;
  let service: SegmentsService;
  const mockSegmentsList: any = [
    { id: 'first', createdAt: '04/25/17 04:34:22 +0000' },
    { id: 'second', createdAt: '04/24/17 04:34:22 +0000' },
    { id: 'third', createdAt: '04/24/17 04:34:22 +0000' },
  ];
  const mockSegment = {
    createdAt: 'time',
    updatedAt: 'time',
    versionNumber: 0,
    id: 'segmentId1',
    name: 'segmentId1',
    context: 'any',
    description: 'segment testing',
    userIds: [],
    groups: [],
    subSegmentIds: [],
    type: SEGMENT_TYPE.PUBLIC,
  };

  beforeEach(() => {
    mockStore = MockStateStore$;
    service = new SegmentsService(mockStore);
  });

  describe('#allSegments$', () => {
    it('should emit sorted list of entities', fakeAsync(() => {
      SegmentSelectors.selectAllSegments.setResult(mockSegmentsList);

      mockStore.next('thisValueIsMeaningless');

      service.allSegments$.subscribe((val) => {
        tick(0);
        expect(val).toEqual([
          { id: 'first', createdAt: '04/25/17 04:34:22 +0000' },
          { id: 'second', createdAt: '04/24/17 04:34:22 +0000' },
          { id: 'third', createdAt: '04/24/17 04:34:22 +0000' },
        ]);
      });
    }));
  });

  describe('#createNewSegment', () => {
    it('should dispatch actionUpsertSegment with the given input', () => {
      const segment = { ...mockSegment };

      service.createNewSegment(segment);

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        actionUpsertSegment({
          segment,
          actionType: UpsertSegmentType.CREATE_NEW_SEGMENT,
        })
      );
    });
  });

  describe('#importSegments', () => {
    it('should dispatch actionUpsertExperiment with the given input', () => {
      const segment = { ...mockSegment };

      service.importSegments([segment]);

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        actionImportSegments({
          segments: [segment],
        })
      );
    });

    describe('#updateSegment', () => {
      it('should dispatch actionUpsertExperiment with the given input', () => {
        const segment = { ...mockSegment } as SegmentInput;
        segment.description = ' updated segment description';

        service.updateSegment(segment);

        expect(mockStore.dispatch).toHaveBeenCalledWith(
          actionUpsertSegment({
            segment,
            actionType: UpsertSegmentType.UPDATE_SEGMENT,
          })
        );
      });
    });

    describe('#deleteSegment', () => {
      it('should dispatch deleteSegment with the given input', () => {
        const segmentId = 'segmentId1';

        service.deleteSegment(segmentId);

        expect(mockStore.dispatch).toHaveBeenCalledWith(
          actionDeleteSegment({
            segmentId,
          })
        );
      });
    });

    describe('#exportSegments', () => {
      it('should dispatch exportSegments with the given input', () => {
        const segmentIds = ['abc123'];

        service.exportSegments(segmentIds);

        expect(mockStore.dispatch).toHaveBeenCalledWith(actionExportSegments({ segmentIds }));
      });
    });
  });
});
