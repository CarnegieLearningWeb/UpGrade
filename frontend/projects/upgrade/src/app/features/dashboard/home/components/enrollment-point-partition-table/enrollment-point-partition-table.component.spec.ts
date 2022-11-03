import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EnrollmentPointPartitionTableComponent } from './enrollment-point-partition-table.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { TableRowComponent } from '../table-row/table-row.component';

xdescribe('EnrollmentPointPartitionTableComponent', () => {
  let component: EnrollmentPointPartitionTableComponent;
  let fixture: ComponentFixture<EnrollmentPointPartitionTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EnrollmentPointPartitionTableComponent, TableRowComponent],
      imports: [TestingModule],
    }).compileComponents();
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
