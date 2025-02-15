import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatureFlagsService } from './feature-flags.service';
import { FeatureFlagsDataService } from './feature-flags.data.service';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { featureFlagsReducer } from './store/feature-flags.reducer';
import { FeatureFlagsEffects } from './store/feature-flags.effects';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    EffectsModule.forFeature([FeatureFlagsEffects]),
    StoreModule.forFeature('featureFlags', featureFlagsReducer),
  ],
  providers: [FeatureFlagsService, FeatureFlagsDataService],
})
export class FeatureFlagsModule {}
