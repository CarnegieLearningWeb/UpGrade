import { CommonModule, UpperCasePipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonStatusIndicatorChipComponent } from '../common-status-indicator-chip/common-status-indicator-chip.component';
import {
  PARTICIPANT_LIST_ROW_ACTION,
  ParticipantListRowActionEvent,
  ParticipantListTableRow,
} from '../../../core/feature-flags/store/feature-flags.model';
import { MemberTypes } from '../../../core/segments/store/segments.model';
import { FEATURE_FLAG_LIST_FILTER_MODE } from 'upgrade_types';

/**
 * `CommonDetailsParticipantListTableComponent` is a reusable Angular component that displays a table with common details for participant lists.
 * It uses Angular Material components for the table and other UI elements.
 *
 * ```html
 * <app-common-details-participant-list-table
 *   [dataSource]="inclusions$ | async"
 *   [isLoading]="isLoading$ | async"
 *   [noDataRowText]="'No data available' | translate"
 *   [slideToggleDisabled]="false"
 *   [actionsDisabled]="false"
 * ></app-common-details-participant-list-table>
 * ```
 */

@Component({
    selector: 'app-common-details-participant-list-table',
    imports: [
        MatTableModule,
        CommonModule,
        MatTooltipModule,
        TranslateModule,
        UpperCasePipe,
        MatChipsModule,
        RouterModule,
        DatePipe,
        MatSlideToggleModule,
        MatIconModule,
        MatButtonModule,
        CommonStatusIndicatorChipComponent,
    ],
    templateUrl: './common-details-participant-list-table.component.html',
    styleUrl: './common-details-participant-list-table.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommonDetailsParticipantListTableComponent {
  @Input() tableType: FEATURE_FLAG_LIST_FILTER_MODE;
  @Input() dataSource: any[];
  @Input() noDataRowText: string;
  @Input() slideToggleDisabled?: boolean = false;
  @Input() actionsDisabled?: boolean = false;
  @Input() isLoading: boolean;
  @Output() rowAction = new EventEmitter<ParticipantListRowActionEvent>();

  displayedColumns: string[];
  memberTypes = MemberTypes;

  PARTICIPANT_LIST_COLUMN_NAMES = {
    TYPE: 'type',
    VALUES: 'values',
    NAME: 'name',
    ENABLE: 'enable',
    ACTIONS: 'actions',
  };

  PARTICIPANT_LIST_TRANSLATION_KEYS = {
    TYPE: 'Type',
    VALUES: 'Values',
    NAME: 'Name',
    ENABLE: 'Enable',
    ACTIONS: 'Actions',
  };

  ngOnInit() {
    this.displayedColumns =
      this.tableType === FEATURE_FLAG_LIST_FILTER_MODE.INCLUSION
        ? ['type', 'values', 'name', 'enable', 'actions']
        : ['type', 'values', 'name', 'actions'];
  }

  onSlideToggleChange(event: MatSlideToggleChange, rowData: ParticipantListTableRow): void {
    const slideToggleEvent = event.source;
    const action = slideToggleEvent.checked ? PARTICIPANT_LIST_ROW_ACTION.ENABLE : PARTICIPANT_LIST_ROW_ACTION.DISABLE;
    this.rowAction.emit({ action, rowData });

    // Note: we don't want the toggle to visibly change state immediately because we have to pop a confirmation modal first, so we need override the default and flip it back. I unfortunately couldn't find a better way to do this.
    slideToggleEvent.checked = !slideToggleEvent.checked;
  }

  onEditButtonClick(rowData: ParticipantListTableRow): void {
    this.rowAction.emit({ action: PARTICIPANT_LIST_ROW_ACTION.EDIT, rowData });
  }

  onDeleteButtonClick(rowData: ParticipantListTableRow): void {
    this.rowAction.emit({ action: PARTICIPANT_LIST_ROW_ACTION.DELETE, rowData });
  }
}
