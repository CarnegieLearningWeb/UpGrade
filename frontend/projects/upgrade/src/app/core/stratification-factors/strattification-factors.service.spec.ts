import { BehaviorSubject } from 'rxjs';
import { StratificationFactorsService } from './stratification-factors.service';
import {
  actionDeleteStratificationFactor,
  actionExportStratificationFactor,
  actionImportStratificationFactor,
  actionFetchStratificationFactors,
} from './store/stratification-factors.actions';

const MockStateStore$ = new BehaviorSubject({});
(MockStateStore$ as any).dispatch = jest.fn();

describe('StratificationFactorsService', () => {
  let mockStore: any;
  let service: StratificationFactorsService;

  beforeEach(() => {
    mockStore = MockStateStore$;
    service = new StratificationFactorsService(mockStore);
  });

  describe('#fetchStratificationFactors', () => {
    it('should dispatch actionFetchStratificationFactors with the given input', () => {
      const isLoading = true;
      service.fetchStratificationFactors(isLoading);
      expect(mockStore.dispatch).toHaveBeenCalledWith(actionFetchStratificationFactors({ isLoading }));
    });
  });

  describe('#deleteStratificationFactors', () => {
    it('should dispatch actionDeleteStratificationFactor with the given input', () => {
      const factor = 'testFactor';
      service.deleteStratificationFactors(factor);
      expect(mockStore.dispatch).toHaveBeenCalledWith(actionDeleteStratificationFactor({ factor }));
    });
  });

  describe('#importStratificationFactors', () => {
    it('should dispatch actionImportStratificationFactor with the given input', () => {
      const csvData = [{ file: 'data,test' }];
      service.importStratificationFactors(csvData);
      expect(mockStore.dispatch).toHaveBeenCalledWith(actionImportStratificationFactor({ csvData }));
    });
  });

  describe('#exportStratificationFactors', () => {
    it('should dispatch actionExportStratificationFactor with the given input', () => {
      const factor = 'testFactor';
      service.exportStratificationFactors(factor);
      expect(mockStore.dispatch).toHaveBeenCalledWith(actionExportStratificationFactor({ factor }));
    });
  });
});
