import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardRootComponent } from './dashboard-root/dashboard-root.component';
import { requireRouteParam } from './require-route-param.guard';

// Conditionally define segments routes based on the toggle
const segmentsRoutes: Routes = [
  {
    path: 'segments',
    loadComponent: () =>
      import('./segments/pages/segment-root-page/segment-root-page.component').then((c) => c.SegmentRootPageComponent),
    data: {
      title: 'app-header.title.segments',
    },
  },
  {
    // An id-less detail URL should land on the list page, not fall through the global wildcard to /home
    path: 'segments/detail',
    redirectTo: '/segments',
    pathMatch: 'full',
  },
  {
    path: 'segments/detail/:segmentId',
    canActivate: [requireRouteParam('segmentId', '/segments')],
    loadComponent: () =>
      import('./segments/pages/segment-details-page/segment-details-page.component').then(
        (c) => c.SegmentDetailsPageComponent
      ),
    data: {
      title: 'app-header.title.segments',
    },
  },
];

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
        loadComponent: () =>
          import('./experiments/pages/experiment-root-page/experiment-root-page.component').then(
            (c) => c.ExperimentRootPageComponent
          ),
        data: {
          title: 'app-header.title.experiments',
        },
      },
      {
        path: 'home/detail',
        redirectTo: '/home',
        pathMatch: 'full',
      },
      {
        path: 'home/detail/:experimentId',
        canActivate: [requireRouteParam('experimentId', '/home')],
        loadComponent: () =>
          import('./experiments/pages/experiment-details-page/experiment-details-page.component').then(
            (c) => c.ExperimentDetailsPageComponent
          ),
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
        loadComponent: () =>
          import('./global-logs/pages/global-logs-root-page/global-logs-root-page.component').then(
            (c) => c.GlobalLogsRootPageComponent
          ),
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
        path: 'featureflags/detail',
        redirectTo: '/featureflags',
        pathMatch: 'full',
      },
      {
        path: 'featureflags/detail/:flagId',
        canActivate: [requireRouteParam('flagId', '/featureflags')],
        loadComponent: () =>
          import('./feature-flags/pages/feature-flag-details-page/feature-flag-details-page.component').then(
            (c) => c.FeatureFlagDetailsPageComponent
          ),
        data: {
          title: 'app-header.title.feature-flag',
        },
      },
      // Spread the conditionally selected segments routes
      ...segmentsRoutes,
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
