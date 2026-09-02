import { featureFlagsReducer, initialState } from './feature-flags.reducer';
import * as FeatureFlagsActions from './feature-flags.actions';
import { FeatureFlag } from './feature-flags.model';
import { PAGE_ERROR_TYPE } from '@shared-component-lib/common-page-error/common-page-error.model';

describe('FeatureFlagsReducer', () => {
  describe('actionFetchFeatureFlagByIdFailure', () => {
    it('should set isLoadingSelectedFeatureFlag to false and set the details page error', () => {
      const previousState = { ...initialState };
      previousState.isLoadingSelectedFeatureFlag = true;
      const testAction = FeatureFlagsActions.actionFetchFeatureFlagByIdFailure({
        featureFlagId: 'abc123',
        errorType: PAGE_ERROR_TYPE.NOT_FOUND,
      });

      const newState = featureFlagsReducer(previousState, testAction);

      expect(newState.isLoadingSelectedFeatureFlag).toEqual(false);
      expect(newState.detailsPageError).toEqual({ entityId: 'abc123', errorType: PAGE_ERROR_TYPE.NOT_FOUND });
    });
  });

  describe('actionFetchFeatureFlagById', () => {
    it('should retain the details page error while a retry is in flight', () => {
      const detailsPageError = { entityId: 'abc123', errorType: PAGE_ERROR_TYPE.LOAD_FAILED };
      const previousState = { ...initialState, detailsPageError };
      const testAction = FeatureFlagsActions.actionFetchFeatureFlagById({ featureFlagId: 'abc123' });

      const newState = featureFlagsReducer(previousState, testAction);

      expect(newState.detailsPageError).toEqual(detailsPageError);
    });
  });

  describe('actionFetchFeatureFlagByIdSuccess', () => {
    it('should clear the details page error of that feature flag', () => {
      const previousState = { ...initialState };
      previousState.detailsPageError = { entityId: 'abc123', errorType: PAGE_ERROR_TYPE.LOAD_FAILED };
      const testAction = FeatureFlagsActions.actionFetchFeatureFlagByIdSuccess({
        flag: { id: 'abc123' } as FeatureFlag,
      });

      const newState = featureFlagsReducer(previousState, testAction);

      expect(newState.detailsPageError).toBeNull();
    });

    it('should not clear the details page error of another feature flag', () => {
      const detailsPageError = { entityId: 'abc123', errorType: PAGE_ERROR_TYPE.LOAD_FAILED };
      const previousState = { ...initialState, detailsPageError };
      const testAction = FeatureFlagsActions.actionFetchFeatureFlagByIdSuccess({
        flag: { id: 'other-id' } as FeatureFlag,
      });

      const newState = featureFlagsReducer(previousState, testAction);

      expect(newState.detailsPageError).toEqual(detailsPageError);
    });
  });
});
