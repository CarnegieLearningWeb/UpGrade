import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Observable } from 'rxjs';
import {
  ExperimentCondition,
  ExperimentConditionPayload,
  ExperimentConditionRowActionEvent,
  EXPERIMENT_PAYLOAD_DISPLAY_TYPE,
  EXPERIMENT_ROW_ACTION,
} from '../../../../../../../../core/experiments/store/experiments.model';
import { SharedModule } from '../../../../../../../../shared/shared.module';

@Component({
  selector: 'app-experiment-conditions-table',
  imports: [
    CommonModule,
    TranslateModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    SharedModule,
  ],
  templateUrl: './experiment-conditions-table.component.html',
  styleUrl: './experiment-conditions-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentConditionsTableComponent {
  @Input() conditions: ExperimentCondition[] = [];
  @Input() conditionPayloads: ExperimentConditionPayload[] = [];
  @Input() isLoading$: Observable<boolean>;
  @Input() actionsDisabled?: boolean = false;
  @Output() rowAction = new EventEmitter<ExperimentConditionRowActionEvent>();
  @Output() editWeights = new EventEmitter<ExperimentCondition[]>();

  displayedColumns: string[] = ['condition', 'payload', 'weight', 'weightEdit', 'actions'];

  // Make enum accessible in template
  EXPERIMENT_PAYLOAD_DISPLAY_TYPE = EXPERIMENT_PAYLOAD_DISPLAY_TYPE;

  CONDITION_TRANSLATION_KEYS = {
    CONDITION: 'experiments.details.conditions.condition.text',
    PAYLOAD: 'experiments.details.conditions.payload.text',
    WEIGHT: 'experiments.details.conditions.weight.text',
    ACTIONS: 'experiments.details.conditions.actions.text',
  };

  /**
   * Determines the type of payload display for a condition
   * Returns 'universal' if all decision points have the same payload,
   * 'specific' if payloads are different across decision points,
   * or 'none' if no payload exists
   */
  getPayloadDisplayType(condition: ExperimentCondition): EXPERIMENT_PAYLOAD_DISPLAY_TYPE {
    if (!this.conditionPayloads || !condition) {
      return EXPERIMENT_PAYLOAD_DISPLAY_TYPE.NONE;
    }

    const conditionPayloads = this.conditionPayloads.filter((payload) => payload.parentCondition === condition.id);

    if (!conditionPayloads.length) {
      return EXPERIMENT_PAYLOAD_DISPLAY_TYPE.NONE;
    }

    // Check if all payloads are the same
    const firstPayload = conditionPayloads[0];
    const allSame = conditionPayloads.every(
      (payload) =>
        payload.payload?.type === firstPayload.payload?.type && payload.payload?.value === firstPayload.payload?.value
    );

    // If all payloads are the same, it's universal
    if (allSame) {
      return EXPERIMENT_PAYLOAD_DISPLAY_TYPE.UNIVERSAL;
    }

    return EXPERIMENT_PAYLOAD_DISPLAY_TYPE.SPECIFIC;
  }

  /**
   * Gets the universal payload value for display
   * Only called when getPayloadDisplayType returns 'universal'
   */
  getUniversalPayload(condition: ExperimentCondition): string {
    if (!this.conditionPayloads || !condition) {
      return '';
    }

    const conditionPayloads = this.conditionPayloads.filter((payload) => payload.parentCondition === condition.id);

    if (conditionPayloads.length > 0) {
      const payload = conditionPayloads[0].payload;
      return payload?.value || '';
    }

    return '';
  }

  onEditButtonClick(condition: ExperimentCondition): void {
    this.rowAction.emit({ action: EXPERIMENT_ROW_ACTION.EDIT, condition });
  }

  onDeleteButtonClick(condition: ExperimentCondition): void {
    this.rowAction.emit({ action: EXPERIMENT_ROW_ACTION.DELETE, condition });
  }

  onEditWeightsClick(): void {
    this.editWeights.emit(this.conditions);
  }
}
