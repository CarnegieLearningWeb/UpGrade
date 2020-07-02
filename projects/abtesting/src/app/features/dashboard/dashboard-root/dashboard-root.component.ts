import { Component } from '@angular/core';
import { SettingsService } from '../../../core/settings/settings.service';
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
      text: 'feature-flags.title.text',
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

  logout() {
    this.authService.authLogout();
  }
}
