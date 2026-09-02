import { initialState } from './feature-flags.reducer';
import { selectFeatureFlagDetailsPageError } from './feature-flags.selectors';
import { PAGE_ERROR_TYPE } from '@shared-component-lib/common-page-error/common-page-error.model';

describe('FeatureFlagsSelectors', () => {
  describe('#selectFeatureFlagDetailsPageError', () => {
    const detailsPageError = { entityId: 'abc123', errorType: PAGE_ERROR_TYPE.NOT_FOUND };
    const routerStateFor = (flagId: string) => ({ state: { params: { flagId } } } as any);

    it('should return the error when it belongs to the feature flag in the route', () => {
      const previousState = { ...initialState, detailsPageError };

      const result = selectFeatureFlagDetailsPageError.projector(routerStateFor('abc123'), previousState);

      expect(result).toEqual(detailsPageError);
    });

    it('should return null when the error belongs to a different feature flag', () => {
      const previousState = { ...initialState, detailsPageError };

      const result = selectFeatureFlagDetailsPageError.projector(routerStateFor('other-id'), previousState);

      expect(result).toBeNull();
    });

    it('should return null when there is no error', () => {
      const previousState = { ...initialState, detailsPageError: null };

      const result = selectFeatureFlagDetailsPageError.projector(routerStateFor('abc123'), previousState);

      expect(result).toBeNull();
    });
  });
});
