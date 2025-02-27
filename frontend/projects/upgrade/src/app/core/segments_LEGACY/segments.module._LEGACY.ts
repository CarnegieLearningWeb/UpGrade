import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EffectsModule } from '@ngrx/effects';
import { SegmentsEffects_LEGACY } from './store/segments.effects._LEGACY';
import { StoreModule } from '@ngrx/store';
import { segmentsReducer_LEGACY } from './store/segments.reducer._LEGACY';
import { SegmentsService_LEGACY } from './segments.service._LEGACY';
import { SegmentsDataService_LEGACY } from './segments.data.service._LEGACY';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    EffectsModule.forFeature([SegmentsEffects_LEGACY]),
    StoreModule.forFeature('segments_LEGACY', segmentsReducer_LEGACY),
  ],
  providers: [SegmentsService_LEGACY, SegmentsDataService_LEGACY],
})
export class SegmentsModule_LEGACY {}
