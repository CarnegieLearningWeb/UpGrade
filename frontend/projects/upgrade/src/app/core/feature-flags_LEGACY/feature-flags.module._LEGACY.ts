import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EffectsModule } from '@ngrx/effects';
import { FeatureFlagsEffects_LEGACY } from './store/feature-flags.effects._LEGACY';
import { StoreModule } from '@ngrx/store';
import { featureFlagsReducer_LEGACY } from './store/feature-flags.reducer._LEGACY';
import { FeatureFlagsService_LEGACY } from './feature-flags.service._LEGACY';
import { FeatureFlagsDataService_LEGACY } from './feature-flags.data.service._LEGACY';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    EffectsModule.forFeature([FeatureFlagsEffects_LEGACY]),
    StoreModule.forFeature('featureFlags_LEGACY', featureFlagsReducer_LEGACY),
  ],
  providers: [FeatureFlagsService_LEGACY, FeatureFlagsDataService_LEGACY],
})
export class FeatureFlagsModule_LEGACY {}
