import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileInfoComponent } from './profile-info.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { UsersService } from '../../../../../core/users/users.service';
import { AuthService } from '../../../../../core/auth/auth.service';
import { SettingsService } from '../../../../../core/settings/settings.service';

xdescribe('ProfileInfoComponent', () => {
  let component: ProfileInfoComponent;
  let fixture: ComponentFixture<ProfileInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ProfileInfoComponent],
      imports: [TestingModule],
      providers: [UsersService, AuthService, SettingsService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
