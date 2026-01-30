import { Component } from '@angular/core';
import { CommonPageComponent } from '../../../../../shared-standalone-component-lib/components';
import { ExperimentRootPageHeaderComponent } from './experiment-root-page-header/experiment-root-page-header.component';
import { ExperimentRootPageContentComponent } from './experiment-root-page-content/experiment-root-page-content.component';

@Component({
  selector: 'app-experiment-root-page',
  templateUrl: './experiment-root-page.component.html',
  styleUrl: './experiment-root-page.component.scss',
  imports: [CommonPageComponent, ExperimentRootPageHeaderComponent, ExperimentRootPageContentComponent],
})
export class ExperimentRootPageComponent {}
