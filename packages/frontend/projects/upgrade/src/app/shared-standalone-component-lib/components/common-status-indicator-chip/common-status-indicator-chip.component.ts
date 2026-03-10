import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, SimpleChanges } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';
import { STATUS_INDICATOR_CHIP_TYPE } from 'upgrade_types';
import { CommonWarningIconComponent } from '../common-warning-icon/common-warning-icon.component';

/**
 * The `app-common-status-indicator-chip` component provides a common component for status indicator inside mat-chip.
 *
 *
 * Example usage:
 *
 * ```html
 * <app-common-status-indicator-chip
 *  [chipClass]="STATUS_INDICATOR_CHIP_TYPE.ENROLLMENT_COMPLETE"
 * ></app-common-status-indicator-chip>
 * ```
 *
 * Providing warning message keys will make a warning icon next to the chip.
 * The messages will be translated and shown as a tooltip when hovered over the icon.
 *
 * ```html
 * <app-common-status-indicator-chip
 *  [chipClass]="STATUS_INDICATOR_CHIP_TYPE.ENROLLMENT_COMPLETE"
 *  [warningMessageKeys]="['feature-flags.warning.no-enabled-inclusions.text']"
 * ></app-common-status-indicator-chip>
 * ```
 */

@Component({
  selector: 'app-common-status-indicator-chip',
  templateUrl: './common-status-indicator-chip.component.html',
  styleUrls: ['./common-status-indicator-chip.component.scss'],
  imports: [CommonModule, TranslateModule, MatChipsModule, CommonWarningIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonStatusIndicatorChipComponent {
  @Input() chipClass!: STATUS_INDICATOR_CHIP_TYPE;
  @Input() warningMessageKeys: string[] = [];
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
    // capitalize the first letter
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
