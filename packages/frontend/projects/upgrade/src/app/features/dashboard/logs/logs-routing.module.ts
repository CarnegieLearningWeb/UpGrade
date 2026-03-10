import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LogsComponent } from './root/logs.component';

const routes: Routes = [
  {
    path: '',
    component: LogsComponent,
    data: {
      title: 'app-header.title.logs',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LogsRoutingModule {}
