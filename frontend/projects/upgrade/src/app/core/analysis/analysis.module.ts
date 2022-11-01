import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { AnalysisEffects } from './store/analysis.effects';
import { analysisReducer } from './store/analysis.reducer';
import { AnalysisDataService } from './analysis.data.service';
import { AnalysisService } from './analysis.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    EffectsModule.forFeature([AnalysisEffects]),
    StoreModule.forFeature('analysis', analysisReducer),
  ],
  providers: [AnalysisService, AnalysisDataService],
})
export class AnalysisModule {}
