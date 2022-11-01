import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileRootComponent } from './profile-root.component';
import { TestingModule } from '../../../../../testing/testing.module';
import { UsersService } from '../../../../core/users/users.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { SettingsService } from '../../../../core/settings/settings.service';
import { ProfileInfoComponent } from '../components/profile-info/profile-info.component';
import { MetricsComponent } from '../components/metrics/metrics.component';
import { AnalysisService } from '../../../../core/analysis/analysis.service';

xdescribe('ProfileRootComponent', () => {
  let component: ProfileRootComponent;
  let fixture: ComponentFixture<ProfileRootComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ProfileRootComponent, ProfileInfoComponent, MetricsComponent],
      imports: [TestingModule],
      providers: [UsersService, AuthService, SettingsService, AnalysisService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileRootComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
