import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QueriesModalComponent } from './queries-modal.component';
import { TestingModule } from '../../../../../../../testing/testing.module';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { AnalysisService } from '../../../../../../core/analysis/analysis.service';
import { CreateQueryComponent } from '../../create-query/create-query.component';

xdescribe('QueriesModalComponent', () => {
  let component: QueriesModalComponent;
  let fixture: ComponentFixture<QueriesModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [QueriesModalComponent, CreateQueryComponent],
      imports: [TestingModule],
      providers: [ExperimentService, AnalysisService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QueriesModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
