import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentPostConditionComponent } from './experiment-post-condition.component';
import { TestingModule } from '../../../../../../testing/testing.module';

xdescribe('ExperimentPostConditionComponent', () => {
  let component: ExperimentPostConditionComponent;
  let fixture: ComponentFixture<ExperimentPostConditionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ExperimentPostConditionComponent],
      imports: [TestingModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentPostConditionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
