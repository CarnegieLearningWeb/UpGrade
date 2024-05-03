import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FeatureFlagsRootComponent } from './feature-flags-root/feature-flags-root.component';
import { ViewFeatureFlagComponent } from './pages/view-feature-flag/view-feature-flag.component';

const routes: Routes = [
  {
    path: '',
    component: FeatureFlagsRootComponent,
    data: { title: 'app-header.title.feature-flag' },
  },
  {
    path: 'detail/:flagId',
    component: ViewFeatureFlagComponent,
    data: { title: 'app-header.title.view-feature-flag' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FeatureFlagsRoutingModule {}
