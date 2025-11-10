import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ExperimentService } from '../../../../../../../core/experiments/experiments.service';
import { Observable } from 'rxjs';
import { UserPermission } from '../../../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../../../core/auth/auth.service';
import { DialogService } from '../../../../../../../shared/services/common-dialog.service';
import {
  ExperimentConditionPayload,
  ExperimentPayloadRowActionEvent,
  EXPERIMENT_ROW_ACTION,
} from '../../../../../../../core/experiments/store/experiments.model';
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
  styleUrl: './experiment-payloads-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentPayloadsSectionCardComponent implements OnInit {
  @Input() isSectionCardExpanded = true;

  permissions$: Observable<UserPermission>;
  selectedExperiment$ = this.experimentService.selectedExperiment$;

  constructor(
    private experimentService: ExperimentService,
    private authService: AuthService,
    private dialogService: DialogService
  ) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
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
