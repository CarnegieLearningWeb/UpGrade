import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PostExperimentRuleComponent } from './post-experiment-rule.component';
import { TestingModule } from '../../../../../../../testing/testing.module';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';

describe('PostExperimentRuleComponent', () => {
  let component: PostExperimentRuleComponent;
  let fixture: ComponentFixture<PostExperimentRuleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PostExperimentRuleComponent ],
      imports: [TestingModule],
      providers: [ExperimentService]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PostExperimentRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
