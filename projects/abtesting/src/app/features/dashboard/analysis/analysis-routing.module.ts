import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AnalysisRootComponent } from './analysis-root/analysis-root.component';

const routes: Routes = [
  {
    path: '',
    component: AnalysisRootComponent,
    data: {
      title: 'app-header.title.analysis'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AnalysisRoutingModule { }
