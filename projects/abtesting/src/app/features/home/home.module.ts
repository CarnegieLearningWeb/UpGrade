import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../../shared/shared.module';

import { HomeComponent } from './root/home.component';
import { HomeRoutingModule } from './home-routing.module';
import { ExperimentListComponent } from './components/experiment-list/experiment-list.component';
import { StoreModule } from '@ngrx/store';
import { FEATURE_NAME, reducers } from './home.state';
import { EffectsModule } from '@ngrx/effects';
import { ExperimentEffects } from './store/experiments/experiments.effects';
import { ExperimentDataService } from './store/experiments/experiments.data.service';
import { ExperimentService } from './store/experiments/experiments.service';

@NgModule({
  declarations: [HomeComponent, ExperimentListComponent],
  imports: [
    CommonModule,
    SharedModule,
    HomeRoutingModule,
    StoreModule.forFeature(FEATURE_NAME, reducers),
    EffectsModule.forFeature([ExperimentEffects])
  ],
  providers: [ExperimentDataService, ExperimentService]
})
export class HomeModule {}
