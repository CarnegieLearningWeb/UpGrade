import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureFlagRootSectionCardListComponent } from './feature-flag-root-section-card-list.component';

describe('FeatureFlagRootSectionCardListComponent', () => {
  let component: FeatureFlagRootSectionCardListComponent;
  let fixture: ComponentFixture<FeatureFlagRootSectionCardListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureFlagRootSectionCardListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FeatureFlagRootSectionCardListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
