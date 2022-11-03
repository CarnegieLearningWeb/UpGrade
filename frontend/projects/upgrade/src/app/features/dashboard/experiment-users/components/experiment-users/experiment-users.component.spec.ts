import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentUsersComponent } from './experiment-users.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { ExperimentUsersService } from '../../../../../core/experiment-users/experiment-users.service';
import { AuthService } from '../../../../../core/auth/auth.service';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';

xdescribe('ExperimentUsersComponent', () => {
  let component: ExperimentUsersComponent;
  let fixture: ComponentFixture<ExperimentUsersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ExperimentUsersComponent],
      imports: [TestingModule],
      providers: [ExperimentUsersService, AuthService, ExperimentService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
