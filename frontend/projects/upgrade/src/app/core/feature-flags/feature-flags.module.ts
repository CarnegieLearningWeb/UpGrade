import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatureFlagsService } from './feature-flags.service';
import { FeatureFlagsDataService } from './feature-flags.data.service';

@NgModule({
  declarations: [],
  imports: [CommonModule],
  providers: [FeatureFlagsService, FeatureFlagsDataService],
})
export class FeatureFlagsModule {}
