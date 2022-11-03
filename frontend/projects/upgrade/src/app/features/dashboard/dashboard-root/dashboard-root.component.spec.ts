import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardRootComponent } from './dashboard-root.component';
import { TestingModule } from '../../../../testing/testing.module';
import { SettingsService } from '../../../core/settings/settings.service';
import { AuthService } from '../../../core/auth/auth.service';

xdescribe('DashboardRootComponent', () => {
  let component: DashboardRootComponent;
  let fixture: ComponentFixture<DashboardRootComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DashboardRootComponent],
      imports: [TestingModule],
      providers: [SettingsService, AuthService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardRootComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
