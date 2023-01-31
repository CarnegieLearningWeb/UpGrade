import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { experimentUsersReducer } from './store/experiment-users.reducer';
import { ExperimentUsersService } from './experiment-users.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature('experimentUsers', experimentUsersReducer),
  ],
  providers: [ExperimentUsersService],
})
export class ExperimentUsersModule {}
