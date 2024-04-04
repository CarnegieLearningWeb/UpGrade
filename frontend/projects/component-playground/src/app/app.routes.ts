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
      import('@shared-standalone-component-lib/components/common-section-card/common-section-card.component').then(
        (c) => c.CommonSectionCardComponent
      ),
  },
];
