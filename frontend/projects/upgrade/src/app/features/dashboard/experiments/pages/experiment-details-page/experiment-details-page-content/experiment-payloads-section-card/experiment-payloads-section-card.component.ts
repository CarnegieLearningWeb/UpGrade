import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ExperimentService } from '../../../../../../../core/experiments/experiments.service';
import { Observable, combineLatest, map } from 'rxjs';
import { UserPermission } from '../../../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../../../core/auth/auth.service';
import { DialogService } from '../../../../../../../shared/services/common-dialog.service';
import {
  Experiment,
  ExperimentConditionPayload,
  ExperimentPayloadRowActionEvent,
  EXPERIMENT_ROW_ACTION,
  EXPERIMENT_SECTION_CARD_TYPE,
} from '../../../../../../../core/experiments/store/experiments.model';
import {
  getSectionCardRestriction,
  SectionCardRestriction,
} from '../../../../../../../core/experiments/experiment-status-restriction-helper.service';
import { ExperimentPayloadsTableComponent } from './experiment-payloads-table/experiment-payloads-table.component';

@Component({
  selector: 'app-experiment-payloads-section-card',
  imports: [
    CommonModule,
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    ExperimentPayloadsTableComponent,
    TranslateModule,
  ],
  templateUrl: './experiment-payloads-section-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentPayloadsSectionCardComponent implements OnInit {
  @Input() isSectionCardExpanded = true;

  selectedExperiment$ = this.experimentService.selectedExperiment$;
  vm$: Observable<{ experiment: Experiment; permissions: UserPermission; restriction: SectionCardRestriction }>;

  constructor(
    readonly experimentService: ExperimentService,
    private readonly authService: AuthService,
    private readonly dialogService: DialogService
  ) {}

  ngOnInit() {
    this.vm$ = combineLatest([this.selectedExperiment$, this.authService.userPermissions$]).pipe(
      map(([experiment, permissions]) => ({
        experiment,
        permissions,
        restriction: getSectionCardRestriction(EXPERIMENT_SECTION_CARD_TYPE.PAYLOADS, experiment?.state),
      }))
    );
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean): void {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }

  onRowAction(event: ExperimentPayloadRowActionEvent): void {
    switch (event.action) {
      case EXPERIMENT_ROW_ACTION.EDIT:
        this.onEditPayload(event.payload);
        break;
      default:
        console.log('Unknown action:', event.action);
    }
  }

  onEditPayload(payload: ExperimentConditionPayload): void {
    this.dialogService.openEditPayloadModal(payload);
  }
}
