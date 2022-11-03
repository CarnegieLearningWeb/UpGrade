import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { AuthEffects } from './store/auth.effects';
import { authReducer } from './store/auth.reducer';
import { AuthService } from './auth.service';
import { AuthDataService } from './auth.data.service';

@NgModule({
  declarations: [],
  imports: [CommonModule, EffectsModule.forFeature([AuthEffects]), StoreModule.forFeature('auth', authReducer)],
  providers: [AuthService, AuthDataService],
})
export class AuthModule {}
