import { AppComponent } from './app.component';

jest.mock('./core/auth/auth.service');
jest.mock('@ngx-translate/core');

describe('AppComponent', () => {
  const mockAuthService = {
    initializeUserSession: jest.fn(),
  };
  const mockTranslateService: any = {
    setDefaultLang: jest.fn(),
  };
  const component = new AppComponent(mockAuthService as any, mockTranslateService);

  describe('#ngOnInit', () => {
    it('should call to set translation service default to "en" and init google auth', () => {
      const expectedLangConstant = 'en';

      component.ngOnInit();

      expect(mockAuthService.initializeUserSession).toHaveBeenCalled();
      expect(mockTranslateService.setDefaultLang).toHaveBeenCalledWith(expectedLangConstant);
    });
  });
});
