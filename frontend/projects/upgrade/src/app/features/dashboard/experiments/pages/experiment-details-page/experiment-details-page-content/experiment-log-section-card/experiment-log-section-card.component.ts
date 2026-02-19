import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ExperimentService } from '../../../../../../../core/experiments/experiments.service';
// import { ExperimentLogSectionCardTableComponent } from './experiment-log-section-card-table/experiment-log-section-card-table.component';
import { MatTableModule } from '@angular/material/table';
import { SharedModule } from '../../../../../../../shared/shared.module';

@Component({
  selector: 'app-experiment-log-section-card',
  imports: [
    CommonModule,
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    // ExperimentLogSectionCardTimelineTableComponent,
    TranslateModule,
    MatTableModule,
    SharedModule,
  ],
  templateUrl: './experiment-log-section-card.component.html',
  styleUrl: './experiment-log-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentLogSectionCardComponent {
  @Input() isSectionCardExpanded = true;

  selectedExperiment$ = this.experimentService.selectedExperiment$;

  constructor(private readonly experimentService: ExperimentService) {}

  onSectionCardExpandChange(isSectionCardExpanded: boolean): void {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }
}
