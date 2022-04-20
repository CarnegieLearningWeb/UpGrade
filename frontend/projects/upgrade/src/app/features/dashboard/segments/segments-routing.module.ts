import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SegmentsRootComponent } from './segments-root/segments-root.component';
import { ViewSegmentComponent } from './pages/view-segment/view-segment.component';

const routes: Routes = [
  {
    path: '',
    component: SegmentsRootComponent,
    data: { title: 'app-header.title.feature-flag' }
  },
  {
    path: 'detail/:flagId',
    component: ViewSegmentComponent,
    data: { title: 'app-header.title.view-feature-flag' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
// TODO rename this
export class FeatureFlagsRoutingModule { }
