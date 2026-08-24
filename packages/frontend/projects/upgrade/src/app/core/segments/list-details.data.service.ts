import { Injectable } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import { EXPERIMENT_STATE, LIST_FILTER_MODE, STANDARD_LIST_TYPE, normalizeStandardListType } from 'upgrade_types';
import { ExperimentDataService } from '../experiments/experiments.data.service';
import { Experiment } from '../experiments/store/experiments.model';
import { FeatureFlagsDataService } from '../feature-flags/feature-flags.data.service';
import { FeatureFlag } from '../feature-flags/store/feature-flags.model';
import { SegmentsDataService } from './segments.data.service';
import {
  EditPrivateSegmentListDetails,
  EditPrivateSegmentListRequest,
  ExperimentSegmentListRequest,
  LIST_OWNER_TYPE,
  ListDetailsOwner,
  ListDetailsOwnerRestriction,
  Segment,
} from './store/segments.model';

@Injectable({ providedIn: 'root' })
export class ListDetailsDataService {
  constructor(
    private experimentDataService: ExperimentDataService,
    private featureFlagsDataService: FeatureFlagsDataService,
    private segmentsDataService: SegmentsDataService
  ) {}

  fetchListDetails(
    ownerType: LIST_OWNER_TYPE,
    ownerId: string,
    filterMode: LIST_FILTER_MODE,
    listId: string
  ): Observable<{ list: Segment; owner: ListDetailsOwner }> {
    return this.fetchOwner(ownerType, ownerId, filterMode, listId).pipe(
      switchMap((owner) => {
        this.requireDirectValueList(owner.listType, listId);
        return this.segmentsDataService.fetchSegmentWithMembersById(listId).pipe(
          map((list) => {
            const declaredListType = normalizeStandardListType(list.listType) || owner.listType;
            const resolvedListType = this.resolveListType(declaredListType, list);

            this.requireDirectValueList(resolvedListType, listId, list.subSegments);
            if (!resolvedListType) {
              throw new Error(`List type for ${listId} cannot be determined from its members.`);
            }

            return { list: { ...list, listType: resolvedListType }, owner };
          })
        );
      })
    );
  }

  fetchOwner(
    ownerType: LIST_OWNER_TYPE,
    ownerId: string,
    filterMode: LIST_FILTER_MODE,
    listId: string
  ): Observable<ListDetailsOwner> {
    switch (ownerType) {
      case LIST_OWNER_TYPE.EXPERIMENT:
        return this.experimentDataService.getExperimentById(ownerId).pipe(
          map((experiment: Experiment) => {
            const lists =
              filterMode === LIST_FILTER_MODE.INCLUSION
                ? experiment.experimentSegmentInclusion
                : experiment.experimentSegmentExclusion;
            const list = this.requireOwnedList(
              lists?.find((entry) => entry.segment?.id === listId),
              listId,
              ownerId
            );
            return {
              id: experiment.id,
              name: experiment.name,
              type: ownerType,
              // The experiment response carries the inferred list type for legacy lists
              // whose own segment row predates the listType column.
              listType: list.segment?.listType,
              restriction: this.getExperimentListRestriction(experiment.state),
            };
          })
        );
      case LIST_OWNER_TYPE.FEATURE_FLAG:
        return this.featureFlagsDataService.fetchFeatureFlagById(ownerId).pipe(
          map((featureFlag: FeatureFlag) => {
            const lists =
              filterMode === LIST_FILTER_MODE.INCLUSION
                ? featureFlag.featureFlagSegmentInclusion
                : featureFlag.featureFlagSegmentExclusion;
            const list = this.requireOwnedList(
              lists?.find((entry) => entry.segment.id === listId),
              listId,
              ownerId
            );
            return {
              id: featureFlag.id,
              name: featureFlag.name,
              type: ownerType,
              listEnabled: list?.enabled,
              listType: list?.listType,
            };
          })
        );
      case LIST_OWNER_TYPE.SEGMENT:
        return this.segmentsDataService.getSegmentById(ownerId).pipe(
          map((response: { segment: Segment }) => {
            if (filterMode !== LIST_FILTER_MODE.EXCLUSION) {
              throw new Error(`List ${listId} does not belong to owner ${ownerId} for ${filterMode}.`);
            }
            const list = this.requireOwnedList(
              response.segment.subSegments?.find((subSegment) => subSegment.id === listId),
              listId,
              ownerId
            );
            return {
              id: response.segment.id,
              name: response.segment.name,
              type: ownerType,
              segmentType: response.segment.type,
              listType: list.listType,
            };
          })
        );
    }
  }

  private getExperimentListRestriction(state: EXPERIMENT_STATE): ListDetailsOwnerRestriction {
    // Match the Experiment Details section-card behavior: completed actions remain
    // visible but disabled, while archived actions are hidden.
    if (state === EXPERIMENT_STATE.ARCHIVED) {
      return {
        isDisabled: true,
        shouldHideActions: true,
        tooltipKey: 'experiments.details.restrictions.experiment-archived.text',
      };
    }

    if (state === EXPERIMENT_STATE.COMPLETED) {
      return {
        isDisabled: true,
        tooltipKey: 'experiments.details.restrictions.experiment-completed.text',
      };
    }

    return { isDisabled: false };
  }

  updateList(
    ownerType: LIST_OWNER_TYPE,
    filterMode: LIST_FILTER_MODE,
    ownerId: string,
    enabled: boolean,
    listType: string,
    segment: EditPrivateSegmentListDetails
  ): Observable<Segment> {
    if (ownerType === LIST_OWNER_TYPE.EXPERIMENT) {
      const request: ExperimentSegmentListRequest = {
        experimentId: ownerId,
        list: { ...segment, listType },
      };
      const update$ =
        filterMode === LIST_FILTER_MODE.INCLUSION
          ? this.experimentDataService.updateInclusionList(request)
          : this.experimentDataService.updateExclusionList(request);
      return update$.pipe(map((response) => response.segment));
    }

    const request: EditPrivateSegmentListRequest = {
      id: ownerId,
      enabled,
      listType,
      segment,
    };

    if (ownerType === LIST_OWNER_TYPE.FEATURE_FLAG) {
      const update$ =
        filterMode === LIST_FILTER_MODE.INCLUSION
          ? this.featureFlagsDataService.updateInclusionList(request)
          : this.featureFlagsDataService.updateExclusionList(request);
      return update$.pipe(map((response) => response.segment));
    }

    return this.segmentsDataService.updateSegmentList(request).pipe(map((response) => response.segment));
  }

  deleteList(ownerType: LIST_OWNER_TYPE, filterMode: LIST_FILTER_MODE, ownerId: string, listId: string) {
    if (ownerType === LIST_OWNER_TYPE.EXPERIMENT) {
      return filterMode === LIST_FILTER_MODE.INCLUSION
        ? this.experimentDataService.deleteInclusionList(listId)
        : this.experimentDataService.deleteExclusionList(listId);
    }

    if (ownerType === LIST_OWNER_TYPE.FEATURE_FLAG) {
      return filterMode === LIST_FILTER_MODE.INCLUSION
        ? this.featureFlagsDataService.deleteInclusionList(listId)
        : this.featureFlagsDataService.deleteExclusionList(listId);
    }

    return this.segmentsDataService.deleteSegmentList(listId, ownerId);
  }

  private requireOwnedList<T>(list: T | undefined, listId: string, ownerId: string): T {
    if (!list) {
      throw new Error(`List ${listId} does not belong to owner ${ownerId}.`);
    }
    return list;
  }

  private requireDirectValueList(listType: string | undefined, listId: string, subSegments?: Segment[]): void {
    const normalizedListType = normalizeStandardListType(listType);
    if (normalizedListType === STANDARD_LIST_TYPE.SEGMENT || (!normalizedListType && (subSegments?.length ?? 0) > 0)) {
      throw new Error(`Segment-backed list ${listId} cannot be opened in List Details.`);
    }
  }

  private resolveListType(listType: string | undefined, list: Segment): string {
    const normalizedListType = normalizeStandardListType(listType);
    if (normalizedListType) {
      return normalizedListType;
    }

    const individuals = list.individualForSegment ?? [];
    const groups = list.groupForSegment ?? [];
    const subSegments = list.subSegments ?? [];

    // Legacy rows predate segment.listType. Match the existing backend compatibility
    // rule and infer only member sets that identify one unambiguous list type.
    if (individuals.length > 0 && groups.length === 0 && subSegments.length === 0) {
      return STANDARD_LIST_TYPE.INDIVIDUAL;
    }

    if (individuals.length === 0 && groups.length > 0 && subSegments.length === 0) {
      const groupType = groups[0].type;
      if (groups.every((group) => group.type !== 'All' && group.type === groupType)) {
        return groupType;
      }
    }

    if (individuals.length === 0 && groups.length === 0 && subSegments.length > 0) {
      return STANDARD_LIST_TYPE.SEGMENT;
    }

    return '';
  }
}
