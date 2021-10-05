import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { experimentUsersReducer } from './store/experiment-users.reducer';
import { ExperimentUsersEffects } from './store/experiment-users.effects';
import { ExperimentUsersService } from './experiment-users.service';
import { ExperimentUsersDataService } from './experiment-users.data.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    EffectsModule.forFeature([ExperimentUsersEffects]),
    StoreModule.forFeature('experimentUsers', experimentUsersReducer)
  ],
  providers: [ExperimentUsersService, ExperimentUsersDataService]
})
export class ExperimentUsersModule {}
