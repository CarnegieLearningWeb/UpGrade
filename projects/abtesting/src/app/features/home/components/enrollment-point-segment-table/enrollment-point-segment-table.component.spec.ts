import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EnrollmentPointSegmentTableComponent } from './enrollment-point-segment-table.component';

describe('EnrollmentPointSegmentTableComponent', () => {
  let component: EnrollmentPointSegmentTableComponent;
  let fixture: ComponentFixture<EnrollmentPointSegmentTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EnrollmentPointSegmentTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EnrollmentPointSegmentTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
