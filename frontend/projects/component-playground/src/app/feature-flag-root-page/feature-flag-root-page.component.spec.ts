import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureFlagRootPageComponent } from './feature-flag-root-page.component';

xdescribe('FeatureFlagRootPageComponent', () => {
  let component: FeatureFlagRootPageComponent;
  let fixture: ComponentFixture<FeatureFlagRootPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureFlagRootPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FeatureFlagRootPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
