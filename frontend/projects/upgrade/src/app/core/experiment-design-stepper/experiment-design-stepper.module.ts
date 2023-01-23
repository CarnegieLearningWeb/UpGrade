import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EffectsModule } from '@ngrx/effects';
import { ExperimentDesignStepperEffects } from './store/experiment-design-stepper.effects';
import { StoreModule } from '@ngrx/store';
import { experimentDesignStepperReducer } from './store/experiment-design-stepper.reducer';
import { ExperimentDesignStepperService } from './experiment-design-stepper.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    EffectsModule.forFeature([ExperimentDesignStepperEffects]),
    StoreModule.forFeature('experimentDesignStepper', experimentDesignStepperReducer),
  ],
  providers: [ExperimentDesignStepperService],
})
export class ExperimentDesignStepperModule {}
