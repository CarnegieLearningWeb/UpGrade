import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FeatureFlagsRoutingModule } from './feature-flags-routing.module';
import { FeatureFlagsRootComponent } from './feature-flags-root/feature-flags-root.component';
import { SharedModule } from '../../../shared/shared.module';
import { FeatureFlagsListComponent } from './components/feature-flags-list/feature-flags-list.component';
import { NewFlagComponent } from './components/modal/new-flag/new-flag.component';
import { FlagOverviewComponent } from './components/flag-overview/flag-overview.component';
import { FlagVariationsComponent } from './components/flag-variations/flag-variations.component';
import { ViewFeatureFlagComponent } from './pages/view-feature-flag/view-feature-flag.component';
import { DeleteFlagComponent } from './components/modal/delete-flag/delete-flag.component';

@NgModule({
  declarations: [
    FeatureFlagsRootComponent,
    FeatureFlagsListComponent,
    NewFlagComponent,
    FlagOverviewComponent,
    FlagVariationsComponent,
    ViewFeatureFlagComponent,
    DeleteFlagComponent,
  ],
  imports: [CommonModule, FeatureFlagsRoutingModule, SharedModule],
})
export class FeatureFlagsModule {}
