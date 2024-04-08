import { Component, Inject, OnInit } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { VersionService } from '../../../core/version/version.service';
import { ENV, Environment } from '../../../../environments/environment-types';

@Component({
  selector: 'app-dashboard-root',
  templateUrl: './dashboard-root.component.html',
  styleUrls: ['./dashboard-root.component.scss'],
})
export class DashboardRootComponent implements OnInit {
  isLoggedIn$ = this.authService.isLoggedIn$;
  currentUser$ = this.authService.currentUser$;
  serverVersion = '';
  routeLinks = [
    {
      path: ['/home'],
      text: 'global.experiment.title',
      iconType: 'assignment',
    },
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
    @Inject(ENV) private environment: Environment,
    private authService: AuthService,
    private versionService: VersionService
  ) {
    if (this.environment.featureFlagNavToggle) {
      this.addFeatureFlagsLink();
    }
  }

  logout() {
    this.authService.authLogout();
  }

  async ngOnInit() {
    this.serverVersion = 'v' + (await this.versionService.getVersion());
  }

  addFeatureFlagsLink() {
    this.routeLinks.splice(1, 0, {
      path: ['/featureflags'],
      text: 'feature-flags.title.text',
      iconType: 'toggle_on',
    });
  }
}
