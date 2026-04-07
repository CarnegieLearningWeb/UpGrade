import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable } from 'rxjs';
import {
  ExperimentCondition,
  ExperimentConditionRowActionEvent,
  EXPERIMENT_ROW_ACTION,
} from '../../../../../../../../core/experiments/store/experiments.model';
import { SharedModule } from '../../../../../../../../shared/shared.module';
import { Prior } from 'upgrade_types';

@Component({
  selector: 'app-experiment-conditions-table',
  imports: [
    CommonModule,
    TranslateModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatTooltipModule,
    SharedModule,
  ],
  templateUrl: './experiment-conditions-table.component.html',
  styleUrl: './experiment-conditions-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentConditionsTableComponent {
  @Input() conditions: ExperimentCondition[] = [];
  @Input() isLoading$: Observable<boolean>;
  @Input() showActions?: boolean = false;
  @Input() actionsDisabled?: boolean = false;
  @Input() actionsTooltip?: string = '';
  @Input() isMoocletExperiment = false;
  @Input() priors?: Record<string, Prior>;
  @Output() rowAction = new EventEmitter<ExperimentConditionRowActionEvent>();
  @Output() editWeights = new EventEmitter<ExperimentCondition[]>();
  @Output() editPriors = new EventEmitter<ExperimentCondition[]>();

  get displayedColumns(): string[] {
    if (this.isMoocletExperiment) {
      return ['condition', 'priorsSuccesses', 'priorsFailures', 'priorsEdit', 'description', 'actions'];
    }
    return ['condition', 'weight', 'weightEdit', 'description', 'actions'];
  }

  CONDITION_TRANSLATION_KEYS = {
    CONDITION: 'experiments.details.conditions.condition.text',
    DESCRIPTION: 'experiments.details.conditions.description.text',
    WEIGHT: 'experiments.details.conditions.weight.text',
    PRIORS_SUCCESSES: 'experiments.details.conditions.priors-successes.text',
    PRIORS_FAILURES: 'experiments.details.conditions.priors-failures.text',
    ACTIONS: 'experiments.details.conditions.actions.text',
  };

  getPriorSuccesses(condition: ExperimentCondition): number {
    return this.priors?.[condition.conditionCode]?.success ?? 1;
  }

  getPriorFailures(condition: ExperimentCondition): number {
    return this.priors?.[condition.conditionCode]?.failure ?? 1;
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

  onEditPriorsClick(): void {
    this.editPriors.emit(this.conditions);
  }
}
