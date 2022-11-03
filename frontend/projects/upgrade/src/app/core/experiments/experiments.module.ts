import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { ExperimentService } from './experiments.service';
import { experimentsReducer } from './store/experiments.reducer';
import { ExperimentEffects } from './store/experiments.effects';
import { ExperimentDataService } from './experiments.data.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    EffectsModule.forFeature([ExperimentEffects]),
    StoreModule.forFeature('experiments', experimentsReducer),
  ],
  providers: [ExperimentService, ExperimentDataService],
})
export class ExperimentsModule {}
