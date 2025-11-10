import { AppComponent } from './app.component';

describe('AppComponent', () => {
  const mockAuthService: any = {
    initializeUserSession: jest.fn(),
  };
  const mockTranslateService: any = {
    setDefaultLang: jest.fn(),
  };
  const mockOverlayContainer: any = {
    getContainerElement: () => {
      return {
        classList: {
          add: jest.fn(),
        },
      };
    },
  };
  const mockHashRoutingNavigationService: any = {
    initializeHashRouting: jest.fn(),
  };

  let component: AppComponent;

  beforeEach(() => {
    component = new AppComponent(
      mockAuthService,
      mockHashRoutingNavigationService,
      mockTranslateService,
      mockOverlayContainer
    );
  });

  describe('#ngOnInit', () => {
    it('should call to set translation service default to "en", init google auth, and globally add light-theme to cdk-overlay for modals', () => {
      const expectedLangConstant = 'en';

      component.ngOnInit();

      expect(mockAuthService.initializeUserSession).toHaveBeenCalled();
      expect(mockTranslateService.setDefaultLang).toHaveBeenCalledWith(expectedLangConstant);
    });
  });
});
