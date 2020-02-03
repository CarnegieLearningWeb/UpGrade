import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './root/home.component';
import { ViewExperimentComponent } from './pages/view-experiment/view-experiment.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    data: { title: 'home' }
  },
  {
    path: 'detail/:experimentId',
    component: ViewExperimentComponent,
    data: { title: 'View Experiment' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule {}
