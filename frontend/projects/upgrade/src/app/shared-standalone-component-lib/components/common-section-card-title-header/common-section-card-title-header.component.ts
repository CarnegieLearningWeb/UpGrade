import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CommonStatusIndicatorChipComponent } from '../common-status-indicator-chip/common-status-indicator-chip.component';
import { STATUS_INDICATOR_CHIP_TYPE } from 'upgrade_types';
import { SharedModule } from '../../../shared/shared.module';

/**
 * The `app-common-section-card-search-header` component provides a common header with title and subtitle for a section card.
 * It includes the following properties:
 * - `title`: The title of the section card.
 * - `tableRowCount`: The count of rows in the table. If it's falsy, nothing will be displayed. If it's greater than 1, the count will be displayed in parentheses.
 * - `subtitle`: The subtitle of the section card.
 * - `showViewLogs`: A boolean that determines whether to show the "View Logs" text anchor tag.
 * - `chipClass`: The class for the status chip. For example, `STATUS_INDICATOR_CHIP_TYPE.ENROLLMENT_COMPLETE`.
 *
 * The component emits a `viewLogs` event when the "View Logs" text is clicked. This event can be used to notify a parent component.
 *
 * Example usage:
 *
 * ```html
 * <app-common-section-card-title-header
 *   [title]="title"
 *   [tableRowCount]="tableRowCount"
 *   [subtitle]="subtitle"
 *   [showViewLogs]="true"
 *   [chipClass]="STATUS_INDICATOR_CHIP_TYPE.ENROLLMENT_COMPLETE"
 *   (viewLogs)="viewLogsClicked($event)"
 * ></app-common-section-card-title-header>
 * ```
 */

@Component({
  standalone: true,
  selector: 'app-common-section-card-title-header',
  templateUrl: './common-section-card-title-header.component.html',
  styleUrls: ['./common-section-card-title-header.component.scss'],
  imports: [CommonModule, TranslateModule, CommonStatusIndicatorChipComponent, SharedModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonSectionCardTitleHeaderComponent {
  @Input() title!: string;
  @Input() tableRowCount?: number;
  @Input() subtitle?: string;
  @Input() createdAt?: string;
  @Input() updatedAt?: string;
  @Input() chipClass?: STATUS_INDICATOR_CHIP_TYPE;
  @Input() showViewLogs?: boolean;
  @Output() viewLogs = new EventEmitter<{ clicked: boolean }>();

  viewLogsClicked(): void {
    this.viewLogs.emit({
      clicked: true,
    });
  }
}
