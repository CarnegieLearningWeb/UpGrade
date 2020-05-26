import { Component } from '@angular/core';
import { SettingsService } from '../../../core/settings/settings.service';
import { ThemeOptions } from '../../../core/settings/store/settings.model';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard-root',
  templateUrl: './dashboard-root.component.html',
  styleUrls: ['./dashboard-root.component.scss']
})
export class DashboardRootComponent {
  theme$ = this.settingsService.theme$;
  isLoggedIn$ = this.authService.isLoggedIn$;
  currentUser$ = this.authService.currentUser$;
  routeLinks = [
    {
      path: ['/home'],
      text: 'global.experiment.title',
      iconType: 'assignment'
    },
    {
      path: ['/featureFlags'],
      text: 'Feature flags',
      iconType: 'toggle_on'
    },
    {
      path: ['/users'],
      text: 'global.experiment-user.title',
      iconType: 'supervisor_account'
    },
    {
      path: ['/logs'],
      text: 'global.logs.title',
      iconType: 'list'
    }
  ];

  constructor(private settingsService: SettingsService, private authService: AuthService) {}

  changeTheme(event) {
    const theme = event.checked ? ThemeOptions.DARK_THEME : ThemeOptions.LIGHT_THEME;
    this.settingsService.changeTheme(theme);
  }

  logout() {
    this.authService.authLogout();
  }

  get ThemeOptions() {
    return ThemeOptions;
  }
}
