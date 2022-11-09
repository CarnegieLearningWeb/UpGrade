import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { UsersEffects } from './store/users.effects';
import { UsersReducer } from './store/users.reducer';
import { UsersService } from './users.service';
import { UsersDataService } from './users.data.service';

@NgModule({
  declarations: [],
  imports: [CommonModule, EffectsModule.forFeature([UsersEffects]), StoreModule.forFeature('users', UsersReducer)],
  providers: [UsersService, UsersDataService],
})
export class UsersModule {}
