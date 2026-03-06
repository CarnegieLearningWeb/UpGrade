import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ExperimentEnrollmentDataComponent } from './experiment-enrollment-data/experiment-enrollment-data.component';
import { ExperimentService } from '../../../../../../../core/experiments/experiments.service';
import { AuthService } from '../../../../../../../core/auth/auth.service';

@Component({
  selector: 'app-experiment-enrollment-data-section-card',
  imports: [
    CommonModule,
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    ExperimentEnrollmentDataComponent,
    TranslateModule,
  ],
  templateUrl: './experiment-enrollment-data-section-card.component.html',
  styleUrl: './experiment-enrollment-data-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentEnrollmentDataSectionCardComponent {
  @Input() isSectionCardExpanded = true;

  selectedExperiment$ = this.experimentService.selectedExperiment$;

  constructor(private readonly experimentService: ExperimentService, private readonly authService: AuthService) {}

  onSectionCardExpandChange(isSectionCardExpanded: boolean): void {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }
}
