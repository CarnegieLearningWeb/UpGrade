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

/**
 * `ExperimentConditionsTableComponent` displays experiment conditions in a table format.
 * It shows condition code, payload information, assignment weight, and provides edit/delete actions.
 *
 * ```html
 * <app-experiment-conditions-table
 *   [conditions]="experiment.conditions"
 *   [conditionPayloads]="experiment.conditionPayloads"
 *   [isLoading$]="isLoading$ | async"
 *   [actionsDisabled]="!(permissions$ | async)?.experiments.update"
 *   (rowAction)="onRowAction($event, experiment.id)"
 * ></app-experiment-conditions-table>
 * ```
 */

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

  displayedColumns: string[] = ['condition', 'payload', 'weight', 'actions'];

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

    // If all payloads are the same and there's more than one decision point,
    // or if there's only one payload, it's universal
    if (allSame && conditionPayloads.length >= 1) {
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
}
