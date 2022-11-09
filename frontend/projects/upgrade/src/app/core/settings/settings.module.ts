import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { SettingsEffects } from './store/settings.effects';
import { settingsReducer } from './store/settings.reducer';
import { SettingsService } from './settings.service';
import { SettingsDataService } from './settings.data.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    EffectsModule.forFeature([SettingsEffects]),
    StoreModule.forFeature('settings', settingsReducer),
  ],
  providers: [SettingsService, SettingsDataService],
})
export class SettingsModule {}
