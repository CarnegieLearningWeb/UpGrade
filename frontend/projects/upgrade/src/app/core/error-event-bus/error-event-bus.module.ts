import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { errorReducer } from './store/error-event-bus.reducer';
import { ErrorEventBus } from './error-event-bus.service';

export const ERROR_EVENT_BUS_FEATURE_STORE_KEY = 'errorEventBus';

@NgModule({
  imports: [CommonModule, StoreModule.forFeature(ERROR_EVENT_BUS_FEATURE_STORE_KEY, errorReducer)],
  providers: [ErrorEventBus],
})
export class ErrorEventBusModule {}
