import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentQueryResultComponent } from './experiment-query-result.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { AnalysisService } from '../../../../../core/analysis/analysis.service';

describe('ExperimentQueryResultComponent', () => {
  let component: ExperimentQueryResultComponent;
  let fixture: ComponentFixture<ExperimentQueryResultComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentQueryResultComponent ],
      imports: [TestingModule, NgxChartsModule],
      providers: [AnalysisService]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentQueryResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
