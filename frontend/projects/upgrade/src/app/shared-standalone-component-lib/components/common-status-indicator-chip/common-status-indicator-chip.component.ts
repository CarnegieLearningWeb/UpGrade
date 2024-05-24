import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';
import { STATUS_INDICATOR_CHIP_TYPE } from 'upgrade_types';

/**
 * The `app-common-status-indicator-chip` component provides a common component for status indicator inside mat-chip.
 * It contains a chipText which will be used to choose chip's border and font color as well.
 * Example usage:
 *
 * ```
 * <app-common-status-indicator-chip chipClass='STATUS_INDICATOR_CHIP_TYPE.ENROLLMENT_COMPLETE'></app-common-status-indicator-chip>
 * ```
 */

@Component({
  standalone: true,
  selector: 'app-common-status-indicator-chip',
  templateUrl: './common-status-indicator-chip.component.html',
  styleUrls: ['./common-status-indicator-chip.component.scss'],
  imports: [CommonModule, TranslateModule, MatChipsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonStatusIndicatorChipComponent {
  @Input() chipClass!: STATUS_INDICATOR_CHIP_TYPE;

  convertKebabToTitleCase(kebabCaseStr: STATUS_INDICATOR_CHIP_TYPE): string {
    return kebabCaseStr
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
