import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { LogsService } from './logs.service';
import { LogsDataService } from './logs.data.service';
import { logsReducer } from './store/logs.reducer';
import { LogsEffects } from './store/logs.effects';

@NgModule({
  declarations: [],
  imports: [CommonModule, EffectsModule.forFeature([LogsEffects]), StoreModule.forFeature('logs', logsReducer)],
  providers: [LogsService, LogsDataService],
})
export class LogsModule {}
