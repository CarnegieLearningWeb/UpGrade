import browser from 'browser-detect';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { SettingsService } from '../../../core/settings/settings.service';
import { ExperimentService } from '../../../core/experiments/experiments.service';
import { ThemeOptions } from '../../../core/settings/store/settings.model';
import { AuditService } from '../../../core/audit/audit.service';
import { AuthService } from '../../../core/auth/auth.service';


@Component({
  selector: 'app-dashboard-root',
  templateUrl: './dashboard-root.component.html',
  styleUrls: ['./dashboard-root.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardRootComponent implements OnInit {

  themeOptions = [
    { value: ThemeOptions.DEFAULT_THEME, viewValue: 'Default' },
    { value: ThemeOptions.DARK_THEME, viewValue: 'Dark' },
    { value: ThemeOptions.LIGHT_THEME, viewValue: 'Light' },
    { value: ThemeOptions.NATURE_THEME, viewValue: 'Nature' }
  ];

  theme$ = this.settingsService.theme$;
  isLoggedIn$ = this.authService.isLoggedIn$;
  currentUser$ = this.authService.currentUser$;

  constructor(
    private settingsService: SettingsService,
    private experimentService: ExperimentService,
    private auditService: AuditService,
    private authService: AuthService
  ) {}

  private static isIEorEdgeOrSafari() {
    return ['ie', 'edge', 'safari'].includes(browser().name);
  }

  ngOnInit(): void {
    this.authService.initializeGapi();
    this.experimentService.loadExperiments();
    this.auditService.loadAudits();
    if (DashboardRootComponent.isIEorEdgeOrSafari()) {
      this.settingsService.changeAnimationsPageDisabled(true);
    }
  }

  changeTheme(theme) {
    this.settingsService.changeTheme(theme);
  }

  logout() {
    this.authService.authLogout();
  }

}
