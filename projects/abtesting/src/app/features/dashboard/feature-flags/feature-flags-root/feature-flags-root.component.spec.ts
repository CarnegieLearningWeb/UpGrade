import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureFlagsRootComponent } from './feature-flags-root.component';

describe('FeatureFlagsRootComponent', () => {
  let component: FeatureFlagsRootComponent;
  let fixture: ComponentFixture<FeatureFlagsRootComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FeatureFlagsRootComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeatureFlagsRootComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
