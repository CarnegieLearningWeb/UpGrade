import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentOverviewComponent } from './experiment-overview.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';

xdescribe('ExperimentOverviewComponent', () => {
  let component: ExperimentOverviewComponent;
  let fixture: ComponentFixture<ExperimentOverviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ExperimentOverviewComponent],
      imports: [TestingModule],
      providers: [ExperimentService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
