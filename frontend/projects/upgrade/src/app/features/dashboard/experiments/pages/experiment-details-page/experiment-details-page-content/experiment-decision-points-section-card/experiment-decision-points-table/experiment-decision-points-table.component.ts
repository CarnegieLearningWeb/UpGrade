import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Observable } from 'rxjs';
import {
  ExperimentDecisionPoint,
  ExperimentDecisionPointRowActionEvent,
  EXPERIMENT_ROW_ACTION,
} from '../../../../../../../../core/experiments/store/experiments.model';
import { SharedModule } from '../../../../../../../../shared/shared.module';

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
    SharedModule,
  ],
  templateUrl: './experiment-decision-points-table.component.html',
  styleUrl: './experiment-decision-points-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentDecisionPointsTableComponent implements OnInit {
  @Input() decisionPoints: ExperimentDecisionPoint[] = [];
  @Input() isLoading$: Observable<boolean>;
  @Input() actionsDisabled?: boolean = false;
  @Output() rowAction = new EventEmitter<ExperimentDecisionPointRowActionEvent>();

  displayedColumns: string[] = ['site', 'target', 'excludeIfReached', 'actions'];

  DECISION_POINT_TRANSLATION_KEYS = {
    SITE: 'experiments.details.decision-points.site.text',
    TARGET: 'experiments.details.decision-points.target.text',
    EXCLUDE_IF_REACHED: 'experiments.details.decision-points.exclude-if-reached.text',
    ACTIONS: 'experiments.details.decision-points.actions.text',
  };

  ngOnInit(): void {
    // Component is ready
  }

  onEditButtonClick(decisionPoint: ExperimentDecisionPoint): void {
    this.rowAction.emit({ action: EXPERIMENT_ROW_ACTION.EDIT, decisionPoint });
  }

  onDeleteButtonClick(decisionPoint: ExperimentDecisionPoint): void {
    this.rowAction.emit({ action: EXPERIMENT_ROW_ACTION.DELETE, decisionPoint });
  }
}
