import { BehaviorSubject } from 'rxjs';
import { LocalStorageService } from '../core.module';
import { SettingsService } from './settings.service';
import * as SettingsActions from './store/settings.actions';

const MockStateStore$ = new BehaviorSubject({});
(MockStateStore$ as any).dispatch = jest.fn();

class MockLocalStorageService extends LocalStorageService {
  setItem = jest.fn();
}

describe('SettingsService', () => {
  let mockStore: any;
  let mockLocalStorageService: LocalStorageService;
  let service: SettingsService;

  beforeEach(() => {
    mockStore = MockStateStore$;
    mockLocalStorageService = new MockLocalStorageService();
    service = new SettingsService(mockStore, mockLocalStorageService);
  });

  describe('#setToCheckAuth', () => {
    it('should dispatch actionSetSetting with toCheckAuth input', () => {
      const toCheckAuth = true;

      service.setToCheckAuth(toCheckAuth);

      expect(mockStore.dispatch).toHaveBeenCalledWith(SettingsActions.actionSetSetting({ setting: { toCheckAuth } }));
    });
  });

  describe('#setToFilterMetric', () => {
    it('should dispatch actionSetSetting with toFilgerMetric input', () => {
      const toFilterMetric = true;

      service.setToFilterMetric(toFilterMetric);

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        SettingsActions.actionSetSetting({ setting: { toFilterMetric } })
      );
    });
  });
});
