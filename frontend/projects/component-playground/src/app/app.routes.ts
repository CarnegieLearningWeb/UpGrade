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
      import('./feature-flag-root-page/feature-flag-root-page.component').then((c) => c.FeatureFlagRootPageComponent),
  },
];
