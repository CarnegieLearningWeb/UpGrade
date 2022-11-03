import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QueryResultComponent } from './query-result.component';
import { TestingModule } from '../../../../testing/testing.module';
import { AnalysisService } from '../../../core/analysis/analysis.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TestMockData } from '../../../../testing/test.mock.data';

xdescribe('QueryResultComponent', () => {
  let component: QueryResultComponent;
  let fixture: ComponentFixture<QueryResultComponent>;

  const modalData = {
    query: TestMockData.getQuery()[0],
  };
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [TestingModule],
      providers: [
        AnalysisService,
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: modalData },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QueryResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
