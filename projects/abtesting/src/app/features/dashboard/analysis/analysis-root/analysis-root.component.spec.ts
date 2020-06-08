import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalysisRootComponent } from './analysis-root.component';
import { TestingModule } from '../../../../../testing/testing.module';
import { MetricsComponent } from '../components/metrics/metrics.component';
import { QueriesComponent } from '../components/queries/queries.component';
import { AnalysisService } from '../../../../core/analysis/analysis.service';

describe('AnalysisRootComponent', () => {
  let component: AnalysisRootComponent;
  let fixture: ComponentFixture<AnalysisRootComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnalysisRootComponent, MetricsComponent, QueriesComponent ],
      imports: [TestingModule],
      providers: [AnalysisService]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalysisRootComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
