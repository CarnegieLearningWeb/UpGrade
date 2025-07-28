import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ExperimentService } from '../../../../../../../../core/experiments/experiments.service';
import { ParticipantListRowActionEvent } from '../../../../../../../../core/feature-flags/store/feature-flags.model';
import { LIST_FILTER_MODE } from 'upgrade_types';
import { CommonDetailsParticipantListTableComponent } from '../../../../../../../../shared-standalone-component-lib/components/common-details-participant-list-table/common-details-participant-list-table.component';

@Component({
  selector: 'app-experiment-inclusions-table',
  imports: [CommonDetailsParticipantListTableComponent, CommonModule, TranslateModule],
  templateUrl: './experiment-inclusions-table.component.html',
  styleUrl: './experiment-inclusions-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentInclusionsTableComponent {
  @Input() actionsDisabled?: boolean = false;
  @Output() rowAction = new EventEmitter<ParticipantListRowActionEvent>();

  tableType = LIST_FILTER_MODE.INCLUSION;
  dataSource$ = this.experimentService.selectExperimentInclusions$;
  isLoading$ = this.experimentService.isLoadingExperiment$;

  constructor(private experimentService: ExperimentService) {}

  onRowAction(event: ParticipantListRowActionEvent): void {
    this.rowAction.emit(event);
  }
}
