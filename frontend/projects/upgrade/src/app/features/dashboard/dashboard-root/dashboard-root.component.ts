import { Component, OnInit } from '@angular/core';
import { SettingsService } from '../../../core/settings/settings.service';
import { AuthService } from '../../../core/auth/auth.service';
import { VersionService } from '../../../core/version/version.service';

@Component({
  selector: 'app-dashboard-root',
  templateUrl: './dashboard-root.component.html',
  styleUrls: ['./dashboard-root.component.scss'],
})
export class DashboardRootComponent implements OnInit {
  theme$ = this.settingsService.theme$;
  isLoggedIn$ = this.authService.isLoggedIn$;
  currentUser$ = this.authService.currentUser$;
  serverVersion = '';
  routeLinks = [
    {
      path: ['/home'],
      text: 'global.experiment.title',
      iconType: 'assignment',
    },
    // {
    //   path: ['/featureFlags'],
    //   text: 'feature-flags.title.text',
    //   iconType: 'toggle_on'
    // },
    {
      path: ['/participants'],
      text: 'global.experiment-user.title',
      iconType: 'supervisor_account',
    },
    {
      path: ['/segments'],
      text: 'global.segments.title',
      iconType: 'group',
    },
    {
      path: ['/logs'],
      text: 'global.logs.title',
      iconType: 'list',
    },
  ];

  constructor(
    private settingsService: SettingsService,
    private authService: AuthService,
    private versionService: VersionService
  ) {}

  logout() {
    this.authService.authLogout();
  }

  async ngOnInit() {
    this.serverVersion = 'v' + (await this.versionService.getVersion());
  }
}
