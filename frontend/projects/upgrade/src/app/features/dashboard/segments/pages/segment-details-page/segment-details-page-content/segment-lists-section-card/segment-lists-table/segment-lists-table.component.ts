import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ParticipantListRowActionEvent } from '../../../../../../../../core/feature-flags/store/feature-flags.model';
import { CommonDetailsParticipantListTableComponent } from '../../../../../../../../shared-standalone-component-lib/components/common-details-participant-list-table/common-details-participant-list-table.component';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SegmentsService } from '../../../../../../../../core/segments/segments.service';
import { FEATURE_FLAG_LIST_FILTER_MODE } from 'upgrade_types';

@Component({
  selector: 'app-segment-lists-table',
  templateUrl: './segment-lists-table.component.html',
  styleUrl: './segment-lists-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonDetailsParticipantListTableComponent, CommonModule, TranslateModule],
})
export class SegmentListsTableComponent {
  @Input() actionsDisabled?: boolean = false;
  tableType = FEATURE_FLAG_LIST_FILTER_MODE.EXCLUSION;
  dataSource$ = this.segmentsService.selectSegmentLists$;
  isLoading$ = this.segmentsService.isLoadingSegments$;
  @Output() rowAction = new EventEmitter<ParticipantListRowActionEvent>();

  constructor(private segmentsService: SegmentsService) {}

  onRowAction(event: ParticipantListRowActionEvent): void {
    this.rowAction.emit(event);
  }
}
