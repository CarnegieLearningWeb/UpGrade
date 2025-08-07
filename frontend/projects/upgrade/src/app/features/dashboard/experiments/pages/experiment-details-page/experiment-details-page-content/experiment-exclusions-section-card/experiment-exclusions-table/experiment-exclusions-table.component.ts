import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ExperimentService } from '../../../../../../../../core/experiments/experiments.service';
import { ParticipantListRowActionEvent } from '../../../../../../../../core/feature-flags/store/feature-flags.model';
import { LIST_FILTER_MODE } from 'upgrade_types';
import { CommonDetailsParticipantListTableComponent } from '../../../../../../../../shared-standalone-component-lib/components/common-details-participant-list-table/common-details-participant-list-table.component';

@Component({
  selector: 'app-experiment-exclusions-table',
  imports: [CommonDetailsParticipantListTableComponent, CommonModule, TranslateModule],
  templateUrl: './experiment-exclusions-table.component.html',
  styleUrl: './experiment-exclusions-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentExclusionsTableComponent {
  @Input() actionsDisabled?: boolean = false;
  tableType = LIST_FILTER_MODE.EXCLUSION;
  dataSource$ = this.experimentService.selectExperimentExclusions$;
  isLoading$ = this.experimentService.isLoadingExperiment$;
  @Output() rowAction = new EventEmitter<ParticipantListRowActionEvent>();

  constructor(private experimentService: ExperimentService) {}

  onRowAction(event: ParticipantListRowActionEvent): void {
    this.rowAction.emit(event);
  }
}
