import { Routes } from '@angular/router';
import { BlankAppStateComponent } from './blank-app-state/blank-app-state.component';

export const appRoutes: Routes = [
  {
    path: '',
    component: BlankAppStateComponent,
  },
  {
    path: 'test-component',
    loadComponent: () =>
      import(
        '@upgrade/src/app/features/dashboard/feature-flags/pages/feature-flag-root-page/feature-flag-root-page.component'
      ).then((c) => c.FeatureFlagRootPageComponent),
  },
];
