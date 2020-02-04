import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuditComponent } from './root/audit.component';

const routes: Routes = [
  {
    path: '',
    component: AuditComponent,
    data: { title: 'audit' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuditRoutingModule {}
