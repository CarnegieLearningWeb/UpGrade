import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, SimpleChanges } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { STATUS_INDICATOR_CHIP_TYPE } from 'upgrade_types';

/**
 * The `app-common-status-indicator-chip` component provides a common component for status indicator inside mat-chip.
 * It contains a chipText which will be used to choose chip's border and font color as well.
 * Example usage:
 *
 * ```
 * <app-common-status-indicator-chip
 *  [chipClass]="STATUS_INDICATOR_CHIP_TYPE.ENROLLMENT_COMPLETE"
 *  [showWarning]="false"
 * ></app-common-status-indicator-chip>
 * ```
 */

@Component({
  selector: 'app-common-status-indicator-chip',
  templateUrl: './common-status-indicator-chip.component.html',
  styleUrls: ['./common-status-indicator-chip.component.scss'],
  imports: [CommonModule, TranslateModule, MatChipsModule, MatIcon, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonStatusIndicatorChipComponent {
  @Input() chipClass!: STATUS_INDICATOR_CHIP_TYPE;
  @Input() showWarning!: boolean;
  chipText = '';

  ngOnInit() {
    this.chipText = this.convertToTitleCase(this.chipClass);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.chipClass?.currentValue) {
      this.chipText = this.convertToTitleCase(changes.chipClass.currentValue);
    }
  }

  convertToTitleCase(value: STATUS_INDICATOR_CHIP_TYPE): string {
    // Handle special case for enrollmentComplete
    if (value === STATUS_INDICATOR_CHIP_TYPE.ENROLLMENT_COMPLETE) {
      return 'Enrollment Complete';
    }

    // For all other cases, just capitalize the first letter
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
