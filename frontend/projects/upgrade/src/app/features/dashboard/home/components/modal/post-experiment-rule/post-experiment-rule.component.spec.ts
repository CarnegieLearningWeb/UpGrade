import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PostExperimentRuleComponent } from './post-experiment-rule.component';
import { TestingModule } from '../../../../../../../testing/testing.module';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { TestMockData } from '../../../../../../../testing/test.mock.data';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

xdescribe('PostExperimentRuleComponent', () => {
  let component: PostExperimentRuleComponent;
  let fixture: ComponentFixture<PostExperimentRuleComponent>;

  const modalData = {
    experiment: TestMockData.getExperiment()[0],
  };
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PostExperimentRuleComponent],
      imports: [TestingModule],
      providers: [
        ExperimentService,
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: modalData },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PostExperimentRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
