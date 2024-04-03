import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeatureFlagOverviewSectionCardHeaderContainerComponent } from './feature-flag-overview-section-card-header-container.component';

xdescribe('FeatureFlagOverviewSectionCardHeaderComponent', () => {
  let component: FeatureFlagOverviewSectionCardHeaderContainerComponent;
  let fixture: ComponentFixture<FeatureFlagOverviewSectionCardHeaderContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureFlagOverviewSectionCardHeaderContainerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureFlagOverviewSectionCardHeaderContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
