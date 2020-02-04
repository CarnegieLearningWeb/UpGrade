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
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadChildren: () =>
          import('./home/home.module').then(m => m.HomeModule)
      },
      {
        path: 'audit',
        loadChildren: () =>
          import('./audit/audit.module').then(m => m.AuditModule)
      },
      {
        path: '**',
        redirectTo: '/home',
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
