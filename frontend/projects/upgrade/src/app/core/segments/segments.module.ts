import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EffectsModule } from '@ngrx/effects';
import { SegmentsEffects } from './store/segments.effects';
import { StoreModule } from '@ngrx/store';
import { segmentsReducer } from './store/segments.reducer';
import { SegmentsService } from './segments.service';
import { SegmentsDataService } from './segments.data.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    EffectsModule.forFeature([SegmentsEffects]),
    StoreModule.forFeature('segments', segmentsReducer),
  ],
  providers: [SegmentsService, SegmentsDataService],
})
export class SegmentsModule {}
