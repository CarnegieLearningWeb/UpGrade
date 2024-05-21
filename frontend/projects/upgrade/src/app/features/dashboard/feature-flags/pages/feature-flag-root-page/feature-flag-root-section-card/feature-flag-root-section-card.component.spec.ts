import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureFlagRootSectionCardComponent } from './feature-flag-root-section-card.component';

describe('FeatureFlagRootSectionCardComponent', () => {
  let component: FeatureFlagRootSectionCardComponent;
  let fixture: ComponentFixture<FeatureFlagRootSectionCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureFlagRootSectionCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureFlagRootSectionCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
