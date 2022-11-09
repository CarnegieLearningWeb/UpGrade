import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewUserComponent } from './preview-user.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { PreviewUsersService } from '../../../../../core/preview-users/preview-users.service';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { AuthService } from '../../../../../core/auth/auth.service';

xdescribe('PreviewUserComponent', () => {
  let component: PreviewUserComponent;
  let fixture: ComponentFixture<PreviewUserComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PreviewUserComponent],
      imports: [TestingModule],
      providers: [PreviewUsersService, ExperimentService, AuthService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PreviewUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
