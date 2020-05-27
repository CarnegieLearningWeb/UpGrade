import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FeatureFlagsRootComponent } from './feature-flags-root/feature-flags-root.component';
import { ViewFeatureFlagComponent } from './pages/view-feature-flag/view-feature-flag.component';

const routes: Routes = [
  {
    path: '',
    component: FeatureFlagsRootComponent,
    data: { title: 'Feature Flags' }
  },
  {
    path: 'detail/:flagId',
    component: ViewFeatureFlagComponent,
    data: { title: 'View Feature Flag' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FeatureFlagsRoutingModule { }
