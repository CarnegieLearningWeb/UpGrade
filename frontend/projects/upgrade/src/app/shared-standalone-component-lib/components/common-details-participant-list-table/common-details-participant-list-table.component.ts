import { CommonModule, UpperCasePipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonStatusIndicatorChipComponent } from '../common-status-indicator-chip/common-status-indicator-chip.component';

/**
 * `CommonDetailsParticipantListTableComponent` is a reusable Angular component that displays a table with common details for participant lists.
 * It uses Angular Material components for the table and other UI elements.
 *
 * ```html
 * <app-common-details-participant-list-table
 *   [dataSource]="inclusions$ | async"
 *   [isLoading]="isLoading$ | async"
 *   [noDataRowText]="'No data available' | translate">
 * </app-common-details-participant-list-table>
 * ```
 */

@Component({
  selector: 'app-common-details-participant-list-table',
  standalone: true,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonDetailsParticipantListTableComponent {
  @Input() dataSource: any[];
  @Input() noDataRowText: string;
  @Input() isLoading: boolean;

  displayedColumns: string[] = ['name', 'type', 'status', 'actions'];
  columnNames = {
    NAME: 'Name',
    TYPE: 'Type',
    STATUS: 'Status',
    ACTIONS: 'Actions',
  };

  fetchFlagsOnScroll() {
    console.log('fetchFlagsOnScroll');
  }

  changeSorting($event) {
    console.log('onSearch:', $event);
  }
}
