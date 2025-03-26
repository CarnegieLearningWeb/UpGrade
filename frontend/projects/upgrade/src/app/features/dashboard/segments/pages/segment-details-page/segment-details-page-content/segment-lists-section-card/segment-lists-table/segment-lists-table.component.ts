import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ParticipantListRowActionEvent } from '../../../../../../../../core/feature-flags/store/feature-flags.model';

@Component({
  selector: 'app-segment-lists-table',
  imports: [],
  templateUrl: './segment-lists-table.component.html',
  styleUrl: './segment-lists-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentListsTableComponent {
  @Input() actionsDisabled = false;
  @Output() rowAction = new EventEmitter<ParticipantListRowActionEvent>();
}
