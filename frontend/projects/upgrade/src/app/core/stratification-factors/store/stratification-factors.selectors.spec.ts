import { initialState } from './stratification-factors.reducers';
import * as StratificationFactorsSelectors from './stratification-factors.selectors';

describe('StratificationFactorsSelectors', () => {
  const mockState = { ...initialState };

  describe('#selectIsLoadingStratificationFactors', () => {
    it('should return boolean from isLoadingStratificationFactors', () => {
      const previousState = { ...mockState };
      previousState.isLoadingStratificationFactors = false;

      const result = StratificationFactorsSelectors.selectIsLoadingStratificationFactors.projector(previousState);

      expect(result).toEqual(false);
    });
  });

  describe('#selectTotalStratificationFactors', () => {
    it('should return the total count of stratification factors', () => {
      const previousState = { ...mockState };
      previousState.totalStratificationFactors = 1;

      const result = StratificationFactorsSelectors.selectTotalStratificationFactors.projector(previousState);

      expect(result).toEqual(1);
    });
  });
});
