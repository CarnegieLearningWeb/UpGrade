import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardRootComponent } from './dashboard-root/dashboard-root.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardRootComponent,
    children: [
      {
        path: '',
        redirectTo: '/home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        loadChildren: () => import('./home/home.module').then((m) => m.HomeModule),
        data: {
          title: 'app-header.title.experiments',
        },
      },
      {
        path: 'participants',
        loadChildren: () => import('./experiment-users/experiment-users.module').then((m) => m.ExperimentUsersModule),
        data: {
          title: 'app-header.title.users',
        },
      },
      {
        path: 'logs',
        loadChildren: () => import('./logs/logs.module').then((m) => m.LogsModule),
        data: {
          title: 'app-header.title.logs',
        },
      },
      // feature-flags is built with standalone components instead of an ngModule, so we need to lazy load the component directly
      // TODO: figure out how to load lazy-loaded child feature routes for feature flags if needed
      {
        path: 'featureflags',
        loadComponent: () =>
          import('./feature-flags/pages/feature-flag-root-page/feature-flag-root-page.component').then(
            (c) => c.FeatureFlagRootPageComponent
          ),
        data: {
          title: 'app-header.title.feature-flag',
        },
      },
      {
        path: 'featureflags/detail/:flagId',
        loadComponent: () =>
          import('./feature-flags/pages/feature-flag-details-page/feature-flag-details-page.component').then(
            (c) => c.FeatureFlagDetailsPageComponent
          ),
        data: {
          title: 'app-header.title.feature-flag',
        },
      },
      {
        path: 'segments',
        loadChildren: () => import('./segments-legacy/segments.module').then((m) => m.SegmentsModule),
        data: {
          title: 'app-header.title.segments',
        },
      },
      {
        path: 'profile',
        loadChildren: () => import('./profile/profile.module').then((m) => m.ProfileModule),
        data: {
          title: 'app-header.title.profile',
        },
      },
      {
        path: '**',
        redirectTo: '/home',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}
