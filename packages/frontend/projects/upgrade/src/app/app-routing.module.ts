import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './core/auth/auth.guard';
import { NegateAuthGuard } from './core/auth/negate.auth.guard';
import { environment } from '../environments/environment';

const routes: Routes = [
  {
    path: 'login',
    canActivate: [NegateAuthGuard],
    loadChildren: () => import('./features/auth/auth.module').then((m) => m.AuthModule),
    data: {
      title: 'app-header.title.login',
    },
  },
  {
    path: '',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/dashboard/dashboard.module').then((m) => m.DashboardModule),
  },
  {
    path: '**',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/dashboard/dashboard.module').then((m) => m.DashboardModule),
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      useHash: environment.useHashRouting,
      scrollPositionRestoration: 'enabled',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
