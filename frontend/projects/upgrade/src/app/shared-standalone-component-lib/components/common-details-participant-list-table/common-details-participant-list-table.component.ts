import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  PARTICIPANT_LIST_ROW_ACTION,
  ParticipantListRowActionEvent,
  ParticipantListTableRow,
} from '../../../core/feature-flags/store/feature-flags.model';
import { MemberTypes } from '../../../core/segments/store/segments.model';
import { LIST_FILTER_MODE, SEGMENT_TYPE } from 'upgrade_types';
import { SharedModule } from '../../../shared/shared.module';

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
    MatChipsModule,
    RouterModule,
    MatSlideToggleModule,
    MatIconModule,
    MatButtonModule,
    SharedModule,
  ],
  templateUrl: './common-details-participant-list-table.component.html',
  styleUrl: './common-details-participant-list-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonDetailsParticipantListTableComponent {
  @Input() tableType: LIST_FILTER_MODE;
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
    TYPE: 'segments.global-type.text',
    VALUES: 'segments.global-values.text',
    NAME: 'segments.global-name.text',
    ENABLE: 'segments.global-enable.text',
    ACTIONS: 'segments.global-actions.text',
  };

  ngOnInit() {
    this.displayedColumns =
      this.tableType === LIST_FILTER_MODE.INCLUSION
        ? ['type', 'values', 'name', 'enable', 'actions']
        : ['type', 'values', 'name', 'actions'];
  }

  getValuesText(rowData: ParticipantListTableRow): string {
    const listType = rowData.listType;
    let count: number;

    if (listType === this.memberTypes.INDIVIDUAL) {
      count = rowData.segment.individualForSegment?.length || 0;
    } else {
      count = rowData.segment.groupForSegment?.length || 0;
    }

    if (count === 0) {
      return '';
    } else if (count === 1) {
      return `${count} Value`;
    } else {
      return `${count} Values`;
    }
  }

  isPublicSegment(rowData: ParticipantListTableRow): boolean {
    return (
      rowData.listType === this.memberTypes.SEGMENT && rowData.segment?.subSegments?.[0]?.type === SEGMENT_TYPE.PUBLIC
    );
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
