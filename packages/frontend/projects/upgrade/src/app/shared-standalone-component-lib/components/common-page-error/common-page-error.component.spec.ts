import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { CommonPageErrorComponent } from './common-page-error.component';
import { CommonPageErrorConfig, PAGE_ERROR_TYPE } from './common-page-error.model';

describe('CommonPageErrorComponent', () => {
  let component: CommonPageErrorComponent;
  let fixture: ComponentFixture<CommonPageErrorComponent>;

  // With no translations loaded, the translate pipe renders the keys themselves
  const config: CommonPageErrorConfig = {
    notFoundTitleKey: 'test.not-found.title',
    notFoundSubtitleKey: 'test.not-found.subtitle',
    loadFailedTitleKey: 'test.load-failed.title',
    loadFailedSubtitleKey: 'test.load-failed.subtitle',
    backButtonKey: 'test.back-button',
    backRoute: '/home',
  };

  const buttons = () => fixture.debugElement.queryAll(By.css('.page-error-actions button'));
  const text = () => (fixture.nativeElement as HTMLElement).textContent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonPageErrorComponent, TranslateModule.forRoot()],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CommonPageErrorComponent);
    component = fixture.componentInstance;
    component.config = config;
  });

  describe('NOT_FOUND variant', () => {
    beforeEach(() => {
      component.errorType = PAGE_ERROR_TYPE.NOT_FOUND;
      fixture.detectChanges();
    });

    it('should render the not-found title and subtitle with only a back button', () => {
      expect(text()).toContain('test.not-found.title');
      expect(text()).toContain('test.not-found.subtitle');
      expect(buttons().length).toBe(1);
      expect(buttons()[0].nativeElement.textContent).toContain('test.back-button');
      expect(text()).not.toContain('global.try-again.text');
    });

    it('should navigate to the configured back route when the back button is clicked', () => {
      const router = TestBed.inject(Router);
      const navigateSpy = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

      buttons()[0].nativeElement.click();

      expect(navigateSpy).toHaveBeenCalled();
      expect(router.serializeUrl(navigateSpy.mock.calls[0][0] as never)).toBe('/home');
    });

    it('should announce the error state to screen readers', () => {
      expect(fixture.debugElement.query(By.css('.page-error')).attributes['role']).toBe('alert');
    });
  });

  describe('LOAD_FAILED variant', () => {
    beforeEach(() => {
      component.errorType = PAGE_ERROR_TYPE.LOAD_FAILED;
      fixture.detectChanges();
    });

    it('should render the load-failed title and subtitle with try-again and back buttons', () => {
      expect(text()).toContain('test.load-failed.title');
      expect(text()).toContain('test.load-failed.subtitle');
      expect(buttons().length).toBe(2);
      expect(buttons()[0].nativeElement.textContent).toContain('global.try-again.text');
      expect(buttons()[1].nativeElement.textContent).toContain('test.back-button');
    });

    it('should emit retry when the try-again button is clicked', () => {
      const retrySpy = jest.fn();
      component.retry.subscribe(retrySpy);

      buttons()[0].nativeElement.click();

      expect(retrySpy).toHaveBeenCalledTimes(1);
    });

    it('should navigate to the configured back route when the back button is clicked', () => {
      const router = TestBed.inject(Router);
      const navigateSpy = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

      buttons()[1].nativeElement.click();

      expect(navigateSpy).toHaveBeenCalled();
      expect(router.serializeUrl(navigateSpy.mock.calls[0][0] as never)).toBe('/home');
    });
  });
});
