import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PostExperimentRuleComponent } from './post-experiment-rule.component';

describe('PostExperimentRuleComponent', () => {
  let component: PostExperimentRuleComponent;
  let fixture: ComponentFixture<PostExperimentRuleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PostExperimentRuleComponent ]
    })
    .compileComponents();
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
