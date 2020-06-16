import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalysisRootComponent } from './analysis-root.component';
import { TestingModule } from '../../../../../testing/testing.module';
import { MetricsComponent } from '../components/metrics/metrics.component';
import { AnalysisService } from '../../../../core/analysis/analysis.service';
import { AuthService } from '../../../../core/auth/auth.service';

describe('AnalysisRootComponent', () => {
  let component: AnalysisRootComponent;
  let fixture: ComponentFixture<AnalysisRootComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnalysisRootComponent, MetricsComponent ],
      imports: [TestingModule],
      providers: [AnalysisService, AuthService]
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
