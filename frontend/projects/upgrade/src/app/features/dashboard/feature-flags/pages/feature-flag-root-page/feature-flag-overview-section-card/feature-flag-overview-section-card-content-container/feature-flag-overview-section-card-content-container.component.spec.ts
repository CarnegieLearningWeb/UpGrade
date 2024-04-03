import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureFlagOverviewSectionCardContentContainerComponent } from './feature-flag-overview-section-card-content-container.component';

describe('FeatureFlagOverviewSectionCardContentContainerComponent', () => {
  let component: FeatureFlagOverviewSectionCardContentContainerComponent;
  let fixture: ComponentFixture<FeatureFlagOverviewSectionCardContentContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureFlagOverviewSectionCardContentContainerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FeatureFlagOverviewSectionCardContentContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
