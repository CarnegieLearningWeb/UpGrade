import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EnrollmentPointPartitionTableComponent } from './enrollment-point-partition-table.component';

describe('EnrollmentPointPartitionTableComponent', () => {
  let component: EnrollmentPointPartitionTableComponent;
  let fixture: ComponentFixture<EnrollmentPointPartitionTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EnrollmentPointPartitionTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EnrollmentPointPartitionTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
