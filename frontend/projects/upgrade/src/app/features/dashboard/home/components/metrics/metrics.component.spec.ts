import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MonitoredMetricsComponent } from './metrics.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';

xdescribe('ExperimentDesignComponent', () => {
  let component: MonitoredMetricsComponent;
  let fixture: ComponentFixture<MonitoredMetricsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MonitoredMetricsComponent],
      imports: [TestingModule],
      providers: [ExperimentService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MonitoredMetricsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
