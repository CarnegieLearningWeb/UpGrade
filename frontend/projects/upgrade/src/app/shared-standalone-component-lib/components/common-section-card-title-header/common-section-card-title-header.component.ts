import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CommonStatusIndicatorChipComponent } from '../common-status-indicator-chip/common-status-indicator-chip.component';
import { STATUS_INDICATOR_CHIP_TYPE } from 'upgrade_types';
import { SharedModule } from '../../../shared/shared.module';
import { CommonWarningIconComponent } from '../common-warning-icon/common-warning-icon.component';

/**
 * The `app-common-section-card-title-header` component provides a common header with title and subtitle for a section card.
 * It includes the following properties:
 * - `title`: The title of the section card.
 * - `tableRowCount`: The count of rows in the table. If it's falsy, nothing will be displayed. If it's 1 or more, the count will be displayed in parentheses.
 * - `subtitle`: The subtitle of the section card.
 * - `createdAt`: The creationAt timestamp of any db entity
 * - `updatedAt`: The updatedAt timestamp of any db entity
 * - `chipClass`: An optional class for the status chip. For example, `STATUS_INDICATOR_CHIP_TYPE.ENROLLMENT_COMPLETE`.
 * - `warningMessage`: An optional warning message to be displayed with a warning icon.
 *
 * Example usage to show basic details:
 *
 * ```html
 * <app-common-section-card-title-header
 *   [title]="title"
 *   [tableRowCount]="tableRowCount"
 *   [subtitle]="subtitle"
 *   [createdAt]="createdAt"
 *   [updatedAt]="updatedAt"
 * ></app-common-section-card-title-header>
 * ```
 *
 * Example usage to show a warning icon next to the title with message in tooltip:
 * Use "warningMessage"
 *
 * ```html
 * <app-common-section-card-title-header
 *   [title]="title"
 *   [tableRowCount]="tableRowCount"
 *   [subtitle]="subtitle"
 *   [createdAt]="createdAt"
 *   [updatedAt]="updatedAt"
 *   [warningMessage]="warningMessage"
 * ></app-common-section-card-title-header>
 * ```
 *
 *  Example usage to show a status chip next to the title
 *  Use "chipClass"
 *
 * ```html
 * <app-common-section-card-title-header
 *   [title]="title"
 *   [tableRowCount]="tableRowCount"
 *   [subtitle]="subtitle"
 *   [createdAt]="createdAt"
 *   [updatedAt]="updatedAt"
 *   [chipClass]="STATUS_INDICATOR_CHIP_TYPE.ENROLLMENT_COMPLETE"
 * ></app-common-section-card-title-header>
 * ```
 *
 *  Example usage to show a status with warning icon
 *  Use chipClass + warningMessage
 *
 * ```html
 * <app-common-section-card-title-header
 *   [title]="title"
 *   [tableRowCount]="tableRowCount"
 *   [subtitle]="subtitle"
 *   [createdAt]="createdAt"
 *   [updatedAt]="updatedAt"
 *   [chipClass]="STATUS_INDICATOR_CHIP_TYPE.ENROLLMENT_COMPLETE"
 *   [warningMessage]="warningMessage"
 * ></app-common-section-card-title-header>
 * ```
 */

@Component({
  selector: 'app-common-section-card-title-header',
  templateUrl: './common-section-card-title-header.component.html',
  styleUrls: ['./common-section-card-title-header.component.scss'],
  imports: [
    CommonModule,
    TranslateModule,
    CommonStatusIndicatorChipComponent,
    SharedModule,
    CommonWarningIconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonSectionCardTitleHeaderComponent {
  @Input() title!: string;
  @Input() tableRowCount?: number;
  @Input() subtitle?: string;
  @Input() createdAt?: string;
  @Input() updatedAt?: string;
  @Input() warningMessage?: string;
  @Input() chipClass?: STATUS_INDICATOR_CHIP_TYPE;
}
