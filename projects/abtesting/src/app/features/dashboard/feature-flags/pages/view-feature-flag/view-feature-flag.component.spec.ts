import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewFeatureFlagComponent } from './view-feature-flag.component';

describe('ViewFeatureFlagComponent', () => {
  let component: ViewFeatureFlagComponent;
  let fixture: ComponentFixture<ViewFeatureFlagComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewFeatureFlagComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewFeatureFlagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
