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
      // {
      //   path: 'featureFlags',
      //   loadChildren: () => import('./feature-flags/feature-flags.module').then(m => m.FeatureFlagsModule),
      //   data: {
      //     title: 'app-header.title.feature-flag'
      //   }
      // },
      {
        path: 'segments',
        loadChildren: () => import('./segments/segments.module').then((m) => m.SegmentsModule),
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
