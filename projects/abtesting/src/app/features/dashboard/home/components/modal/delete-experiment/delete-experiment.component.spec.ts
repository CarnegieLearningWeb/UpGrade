import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteExperimentComponent } from './delete-experiment.component';
import { TestingModule } from '../../../../../../../testing/testing.module';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';

describe('DeleteExperimentComponent', () => {
  let component: DeleteExperimentComponent;
  let fixture: ComponentFixture<DeleteExperimentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeleteExperimentComponent ],
      imports: [TestingModule],
      providers: [ExperimentService]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteExperimentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
