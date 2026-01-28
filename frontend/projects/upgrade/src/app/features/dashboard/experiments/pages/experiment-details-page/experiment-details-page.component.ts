import { Component } from '@angular/core';
import { CommonPageComponent } from '../../../../../shared-standalone-component-lib/components';
import { ExperimentDetailsPageHeaderComponent } from './experiment-details-page-header/experiment-details-page-header.component';
import { ExperimentDetailsPageContentComponent } from './experiment-details-page-content/experiment-details-page-content.component';

@Component({
  selector: 'app-experiment-details-page',
  templateUrl: './experiment-details-page.component.html',
  styleUrl: './experiment-details-page.component.scss',
  imports: [CommonPageComponent, ExperimentDetailsPageHeaderComponent, ExperimentDetailsPageContentComponent],
})
export class ExperimentDetailsPageComponent {}
