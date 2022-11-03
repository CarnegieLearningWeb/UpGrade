import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentDesignComponent } from './experiment-design.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';

xdescribe('ExperimentDesignComponent', () => {
  let component: ExperimentDesignComponent;
  let fixture: ComponentFixture<ExperimentDesignComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ExperimentDesignComponent],
      imports: [TestingModule],
      providers: [ExperimentService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentDesignComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
