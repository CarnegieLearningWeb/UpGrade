import { AppComponent } from './app.component';
import { AuthService } from './core/auth/auth.service';
import { AppState } from './core/core.state';
import { Store } from '@ngrx/store';

jest.mock('./core/auth/auth.service');
jest.mock('@ngx-translate/core');

describe('AppComponent', () => {
  const mockAuthService = new AuthService({} as Store<AppState>);
  const mockTranslateService: any = {
    setDefaultLang : jest.fn()
  };
  const component = new AppComponent(mockAuthService, mockTranslateService)

  describe('#ngOnInit', () => {
    it('should call to set translation service default to "en" and init google auth', () => {
      const expectedLangConstant = 'en';

      component.ngOnInit();

      expect(mockAuthService.initializeGapi).toHaveBeenCalled();
      expect(mockTranslateService.setDefaultLang).toHaveBeenCalledWith(expectedLangConstant)
    })
  })
});
