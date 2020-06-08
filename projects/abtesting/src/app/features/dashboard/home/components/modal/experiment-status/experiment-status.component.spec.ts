import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentStatusComponent } from './experiment-status.component';
import { TestingModule } from '../../../../../../../testing/testing.module';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';

describe('ExperimentStatusComponent', () => {
  let component: ExperimentStatusComponent;
  let fixture: ComponentFixture<ExperimentStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentStatusComponent ],
      imports: [TestingModule, OwlDateTimeModule, OwlNativeDateTimeModule],
      providers: [ExperimentService]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
