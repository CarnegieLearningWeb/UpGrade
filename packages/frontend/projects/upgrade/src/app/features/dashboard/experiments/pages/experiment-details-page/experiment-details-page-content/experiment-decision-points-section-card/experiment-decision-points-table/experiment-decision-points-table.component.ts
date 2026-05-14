import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable } from 'rxjs';
import {
  ExperimentDecisionPoint,
  ExperimentDecisionPointRowActionEvent,
  EXPERIMENT_ROW_ACTION,
} from '../../../../../../../../core/experiments/store/experiments.model';
import { SharedModule } from '../../../../../../../../shared/shared.module';
import { EXPERIMENT_STATE } from 'upgrade_types';

@Component({
  selector: 'app-experiment-decision-points-table',
  imports: [
    CommonModule,
    TranslateModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressBarModule,
    MatTooltipModule,
    SharedModule,
  ],
  templateUrl: './experiment-decision-points-table.component.html',
  styleUrl: './experiment-decision-points-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentDecisionPointsTableComponent {
  @Input() decisionPoints: ExperimentDecisionPoint[] = [];
  @Input() isLoading$: Observable<boolean>;
  @Input() showActions?: boolean = false;
  @Input() actionsDisabled?: boolean = false;
  @Input() actionsTooltip?: string = '';
  @Input() experimentState?: EXPERIMENT_STATE;
  @Output() rowAction = new EventEmitter<ExperimentDecisionPointRowActionEvent>();

  displayedColumns: string[] = ['site', 'target', 'excludeIfReached', 'actions'];

  DECISION_POINT_TRANSLATION_KEYS = {
    SITE: 'experiments.details.decision-points.site.text',
    TARGET: 'experiments.details.decision-points.target.text',
    EXCLUDE_IF_REACHED: 'experiments.details.decision-points.exclude-if-reached.text',
    ACTIONS: 'experiments.details.decision-points.actions.text',
  };

  constructor(private readonly translate: TranslateService) {}

  isRowActionDisabled(dp: ExperimentDecisionPoint): boolean {
    if (this.experimentState === EXPERIMENT_STATE.PAUSED) {
      return !dp.pendingActivation;
    }
    return this.actionsDisabled ?? false;
  }

  getRowActionTooltip(dp: ExperimentDecisionPoint): string {
    if (this.experimentState === EXPERIMENT_STATE.PAUSED) {
      const key = dp.pendingActivation
        ? 'experiments.details.decision-points.paused-row-tooltip.pending.text'
        : 'experiments.details.decision-points.paused-row-tooltip.locked.text';
      return this.translate.instant(key);
    }
    return this.actionsTooltip ?? '';
  }

  isRowActionTooltipShown(dp: ExperimentDecisionPoint): boolean {
    if (this.experimentState === EXPERIMENT_STATE.PAUSED) {
      return true;
    }
    return this.actionsDisabled ?? false;
  }

  onEditButtonClick(decisionPoint: ExperimentDecisionPoint): void {
    this.rowAction.emit({ action: EXPERIMENT_ROW_ACTION.EDIT, decisionPoint });
  }

  onDeleteButtonClick(decisionPoint: ExperimentDecisionPoint): void {
    this.rowAction.emit({ action: EXPERIMENT_ROW_ACTION.DELETE, decisionPoint });
  }
}
