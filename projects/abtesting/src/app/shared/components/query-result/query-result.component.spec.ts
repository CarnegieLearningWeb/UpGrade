import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QueryResultComponent } from './query-result.component';
import { TestingModule } from '../../../../testing/testing.module';
import { AnalysisService } from '../../../core/analysis/analysis.service';

describe('QueryResultComponent', () => {
  let component: QueryResultComponent;
  let fixture: ComponentFixture<QueryResultComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QueryResultComponent ],
      imports: [TestingModule],
      providers: [AnalysisService]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QueryResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
