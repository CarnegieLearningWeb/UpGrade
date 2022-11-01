import { BehaviorSubject } from 'rxjs';
import { LocalStorageService } from '../core.module';
import { SettingsService } from './settings.service';
import * as SettingsActions from './store/settings.actions';
import { ThemeOptions } from './store/settings.model';

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

  describe('#changeTheme', () => {
    it('should dispatch actionsChangeTheme with theme input', () => {
      const theme = ThemeOptions.DARK_THEME;

      service.changeTheme(theme);

      expect(mockStore.dispatch).toHaveBeenCalledWith(SettingsActions.actionChangeTheme({ theme }));
    });
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

  describe('#setToFilterMetric', () => {
    it('should get and apply theme from localStorage', () => {
      const settings = { theme: ThemeOptions.DARK_THEME };
      service.changeTheme = jest.fn();
      mockLocalStorageService.getItem = jest.fn().mockReturnValue(settings);

      service.setLocalStorageTheme();

      expect(service.changeTheme).toHaveBeenCalledWith(ThemeOptions.DARK_THEME);
    });

    it('should not and apply theme if localstorage item is falsey', () => {
      const settings = null;
      service.changeTheme = jest.fn();
      mockLocalStorageService.getItem = jest.fn().mockReturnValue(settings);

      service.setLocalStorageTheme();

      expect(service.changeTheme).not.toHaveBeenCalledWith(ThemeOptions.DARK_THEME);
    });
  });
});
