import browser from 'browser-detect';
import { Component, OnInit } from '@angular/core';
import { SettingsService } from '../../../core/settings/settings.service';
import { ThemeOptions } from '../../../core/settings/store/settings.model';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard-root',
  templateUrl: './dashboard-root.component.html',
  styleUrls: ['./dashboard-root.component.scss']
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
  routeLinks = [
    {
      path: ['/home'],
      text: 'global.experiment.title',
      iconType: 'files'
    },
    {
      path: ['/featureFlags'],
      text: 'Feature flags',
      iconType: 'featureFlag'
    },
    {
      path: ['/users'],
      text: 'global.experiment-user.title',
      iconType: 'user-group'
    },
    {
      path: ['/logs'],
      text: 'global.logs.title',
      iconType: 'list'
    }
  ];

  constructor(private settingsService: SettingsService, private authService: AuthService) {}

  private static isIEorEdgeOrSafari() {
    return ['ie', 'edge', 'safari'].includes(browser().name);
  }

  ngOnInit(): void {
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
