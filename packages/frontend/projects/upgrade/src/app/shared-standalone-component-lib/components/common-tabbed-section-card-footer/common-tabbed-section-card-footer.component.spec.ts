import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { CommonTabbedSectionCardFooterComponent } from './common-tabbed-section-card-footer.component';

@Component({
  imports: [CommonTabbedSectionCardFooterComponent],
  template: `<app-common-tabbed-section-card-footer
    [tabLabels]="tabLabels"
    (selectedTabChange)="onSelectedTabChange($event)"
  ></app-common-tabbed-section-card-footer>`,
})
class TestHostComponent {
  tabLabels: { label: string; disabled?: boolean }[] = [{ label: 'Lists' }, { label: 'Used By' }];
  onSelectedTabChange = jest.fn();
}

describe('CommonTabbedSectionCardFooterComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let mockRouter: { navigate: jest.Mock };

  const mockRoute = {
    snapshot: {
      queryParamMap: {
        get: jest.fn().mockReturnValue(null),
      },
    },
  } as unknown as ActivatedRoute;

  const flushMicrotasks = async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    mockRouter = { navigate: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideNoopAnimations(),
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await flushMicrotasks();
    mockRouter.navigate.mockClear();
    host.onSelectedTabChange.mockClear();
  });

  it('should not navigate when tabLabels is replaced with equal labels but new object identities', async () => {
    // Simulates a details page re-emitting tab labels after a store update (e.g. a list
    // was added and the parent entity was replaced). The rebuilt labels must not cause a
    // programmatic selectedTabChange -> router.navigate, which would cancel an in-flight
    // navigation such as the redirect to the new List Details page.
    host.tabLabels = [{ label: 'Lists' }, { label: 'Used By' }];
    fixture.detectChanges();
    await flushMicrotasks();

    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should navigate with the tab query param when the user changes tabs', async () => {
    const tabHeaders: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.mat-mdc-tab');
    expect(tabHeaders.length).toBe(2);

    tabHeaders[1].click();
    fixture.detectChanges();
    await flushMicrotasks();

    expect(mockRouter.navigate).toHaveBeenCalledWith([], {
      relativeTo: mockRoute,
      queryParams: { tab: 1 },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    expect(host.onSelectedTabChange).toHaveBeenCalledWith(1);
  });
});
