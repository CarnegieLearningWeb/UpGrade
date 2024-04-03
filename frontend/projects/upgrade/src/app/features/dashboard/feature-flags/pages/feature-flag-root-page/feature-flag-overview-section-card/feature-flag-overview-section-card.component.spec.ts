import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureFlagOverviewSectionCardComponent } from './feature-flag-overview-section-card.component';

describe('FeatureFlagOverviewSectionCardComponent', () => {
  let component: FeatureFlagOverviewSectionCardComponent;
  let fixture: ComponentFixture<FeatureFlagOverviewSectionCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureFlagOverviewSectionCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureFlagOverviewSectionCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
