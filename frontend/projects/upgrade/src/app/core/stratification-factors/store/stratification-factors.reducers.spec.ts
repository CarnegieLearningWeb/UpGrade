import { stratificationFactorsReducer, initialState } from './stratification-factors.reducers';
import * as StratificationFactorsActions from '../store/stratification-factors.actions';
import { StratificationFactor } from './stratification-factors.model';

const mockStratificationFactor: StratificationFactor = {
  factor: 'favourite_food',
  factorValue: { pizza: 10, burger: 5 },
};
describe('StratificationFactorsReducer', () => {
  describe('actionFetchStratificationFactors', () => {
    it('should set isLoading to true', () => {
      const previousState = { ...initialState };
      previousState.isLoading = true;

      const testAction = StratificationFactorsActions.actionFetchStratificationFactors({
        isLoading: true,
      });

      const newState = stratificationFactorsReducer(previousState, testAction);

      expect(newState.isLoading).toEqual(true);
    });
  });

  describe('actionFetchStratificationFactorsSuccess', () => {
    it('should set stratificationFactors and isLoading to false', () => {
      const previousState = { ...initialState };
      previousState.isLoading = false;

      const testAction = StratificationFactorsActions.actionFetchStratificationFactorsSuccess({
        stratificationFactors: [mockStratificationFactor],
      });

      const newState = stratificationFactorsReducer(previousState, testAction);

      expect(newState.entities[mockStratificationFactor.factor]).toEqual(mockStratificationFactor);
      expect(newState.isLoading).toEqual(false);
    });
  });

  describe('actions to request failures and set isLoading to false', () => {
    const testActions = {
      actionFetchStratificationFactorsFailure: StratificationFactorsActions.actionFetchStratificationFactorsFailure,
      actionDeleteStratificationFactorFailure: StratificationFactorsActions.actionDeleteStratificationFactorFailure,
    };

    for (const actionKey in testActions) {
      const previousState = { ...initialState };
      previousState.isLoading = false;

      const newState = stratificationFactorsReducer(previousState, testActions[actionKey]());

      it(`on ${actionKey} reducer should return a state with isLoading: false`, () => {
        expect(newState.isLoading).toEqual(false);
      });
    }
  });

  describe('actionDeleteStratificationFactorSuccess', () => {
    it('should remove stratification factor from entities', () => {
      const previousState = { ...initialState };
      previousState.entities = {
        [mockStratificationFactor.factor]: mockStratificationFactor,
      };

      const testAction = StratificationFactorsActions.actionDeleteStratificationFactorSuccess({
        stratificationFactor: mockStratificationFactor,
      });

      const newState = stratificationFactorsReducer(previousState, testAction);

      expect(newState.entities[mockStratificationFactor.factor]).toBeUndefined();
    });
  });

  describe('actionSetIsLoadingStratificationFactors', () => {
    it('should set boolean for isLoading', () => {
      const previousState = { ...initialState };
      previousState.isLoading = false;

      const testAction = StratificationFactorsActions.actionSetIsLoadingStratificationFactors({
        isLoading: true,
      });

      const newState = stratificationFactorsReducer(previousState, testAction);

      expect(newState.isLoading).toEqual(true);
    });
  });
});
