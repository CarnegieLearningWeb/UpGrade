import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Observable } from 'rxjs';
import {
  ExperimentConditionPayload,
  ExperimentCondition,
  ExperimentDecisionPoint,
  ExperimentPayloadRowActionEvent,
  EXPERIMENT_ROW_ACTION,
} from '../../../../../../../../core/experiments/store/experiments.model';
import { SharedModule } from '../../../../../../../../shared/shared.module';

@Component({
  selector: 'app-experiment-payloads-table',
  imports: [
    CommonModule,
    TranslateModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    SharedModule,
  ],
  templateUrl: './experiment-payloads-table.component.html',
  styleUrl: './experiment-payloads-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentPayloadsTableComponent {
  @Input() conditionPayloads: ExperimentConditionPayload[] = [];
  @Input() conditions: ExperimentCondition[] = [];
  @Input() partitions: ExperimentDecisionPoint[] = [];
  @Input() isLoading$: Observable<boolean>;
  @Input() actionsDisabled?: boolean = false;
  @Output() rowAction = new EventEmitter<ExperimentPayloadRowActionEvent>();

  displayedColumns: string[] = ['site', 'target', 'condition', 'payload', 'actions'];

  PAYLOAD_TRANSLATION_KEYS = {
    SITE: 'experiments.details.payloads.site.text',
    TARGET: 'experiments.details.payloads.target.text',
    CONDITION: 'experiments.details.payloads.condition.text',
    PAYLOAD: 'experiments.details.payloads.payload.text',
    ACTIONS: 'experiments.details.payloads.actions.text',
  };

  // Get site name from decision point ID
  getSite(decisionPointId: string): string {
    const decisionPoint = this.partitions.find((dp) => dp.id === decisionPointId);
    return decisionPoint?.site || '';
  }

  // Get target name from decision point ID
  getTarget(decisionPointId: string): string {
    const decisionPoint = this.partitions.find((dp) => dp.id === decisionPointId);
    return decisionPoint?.target || '';
  }

  // Get condition name from condition ID
  getConditionName(conditionId: string): string {
    const condition = this.conditions.find((c) => c.id === conditionId);
    return condition?.conditionCode || '';
  }

  onEditButtonClick(payload: ExperimentConditionPayload): void {
    this.rowAction.emit({ action: EXPERIMENT_ROW_ACTION.EDIT, payload });
  }
}
