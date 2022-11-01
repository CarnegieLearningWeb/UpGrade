import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateQueryComponent } from './create-query.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { AnalysisService } from '../../../../../core/analysis/analysis.service';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';

xdescribe('CreateQueryComponent', () => {
  let component: CreateQueryComponent;
  let fixture: ComponentFixture<CreateQueryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreateQueryComponent],
      imports: [TestingModule],
      providers: [AnalysisService, ExperimentService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateQueryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
