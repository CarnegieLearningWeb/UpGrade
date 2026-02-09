import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StratificationFactorsDataService } from './stratification-factors.data.service';
import { StratificationFactorsService } from './stratification-factors.service';
import { stratificationFactorsReducer } from './store/stratification-factors.reducers';
import { StratificationFactorsEffects } from './store/stratification-factors.effects';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    EffectsModule.forFeature([StratificationFactorsEffects]),
    StoreModule.forFeature('stratificationFactors', stratificationFactorsReducer),
  ],
  providers: [StratificationFactorsService, StratificationFactorsDataService],
})
export class StratificationFactorsModule {}
