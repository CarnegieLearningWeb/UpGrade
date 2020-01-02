import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EnrollmentConditionTableComponent } from './enrollment-condition-table.component';

describe('EnrollmentConditionTableComponent', () => {
  let component: EnrollmentConditionTableComponent;
  let fixture: ComponentFixture<EnrollmentConditionTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EnrollmentConditionTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EnrollmentConditionTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
