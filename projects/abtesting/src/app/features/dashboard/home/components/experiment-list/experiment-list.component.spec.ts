import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentListComponent } from './experiment-list.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { AuthService } from '../../../../../core/auth/auth.service';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';

describe('ExperimentListComponent', () => {
  let component: ExperimentListComponent;
  let fixture: ComponentFixture<ExperimentListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentListComponent ],
      imports: [TestingModule],
      providers: [ExperimentService, AuthService]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
