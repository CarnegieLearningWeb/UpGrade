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
  ExperimentConditionRowActionEvent,
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
  @Input() isLoading$: Observable<boolean>;
  @Input() actionsDisabled?: boolean = false;
  @Output() rowAction = new EventEmitter<ExperimentConditionRowActionEvent>();
  @Output() editWeights = new EventEmitter<ExperimentCondition[]>();

  displayedColumns: string[] = ['condition', 'weight', 'weightEdit', 'description', 'actions'];

  // Make enum accessible in template

  CONDITION_TRANSLATION_KEYS = {
    CONDITION: 'experiments.details.conditions.condition.text',
    DESCRIPTION: 'experiments.details.conditions.description.text',
    WEIGHT: 'experiments.details.conditions.weight.text',
    ACTIONS: 'experiments.details.conditions.actions.text',
  };

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
