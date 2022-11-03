import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EnrollmentConditionTableComponent } from './enrollment-condition-table.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { TableRowComponent } from '../table-row/table-row.component';
import { EnrollmentPointPartitionTableComponent } from '../enrollment-point-partition-table/enrollment-point-partition-table.component';

xdescribe('EnrollmentConditionTableComponent', () => {
  let component: EnrollmentConditionTableComponent;
  let fixture: ComponentFixture<EnrollmentConditionTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EnrollmentConditionTableComponent, TableRowComponent, EnrollmentPointPartitionTableComponent],
      imports: [TestingModule],
    }).compileComponents();
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
