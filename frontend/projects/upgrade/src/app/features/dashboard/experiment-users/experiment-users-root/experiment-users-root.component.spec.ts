import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentUsersRootComponent } from './experiment-users-root.component';
import { TestingModule } from '../../../../../testing/testing.module';
import { ExperimentUsersComponent } from '../components/experiment-users/experiment-users.component';
import { ExperimentService } from '../../../../core/experiments/experiments.service';
import { PreviewUsersService } from '../../../../core/preview-users/preview-users.service';
import { PreviewUserComponent } from '../components/preview-user/preview-user.component';
import { ExperimentUsersService } from '../../../../core/experiment-users/experiment-users.service';
import { AuthService } from '../../../../core/auth/auth.service';

xdescribe('UserRootComponent', () => {
  let component: ExperimentUsersRootComponent;
  let fixture: ComponentFixture<ExperimentUsersRootComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ExperimentUsersRootComponent, ExperimentUsersComponent, PreviewUserComponent],
      imports: [TestingModule],
      providers: [ExperimentService, PreviewUsersService, ExperimentUsersService, AuthService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentUsersRootComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
