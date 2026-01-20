import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateService } from '@ngx-translate/core';

/**
 * The `app-common-warning-icon` component provides a common warning icon with a tooltip if provided with translation keys.
 * It displays a warning_amber Material icon with a tooltip when hovered.
 * The component handles translation and formatting of warning messages internally.
 *
 * Example usage:
 *
 * ```html
 * <app-common-warning-icon
 *   [warningMessageKeys]="['feature-flags.warning.no-enabled-inclusions.text']"
 * ></app-common-warning-icon>
 * ```
 *
 * Multiple warnings will be displayed as a bulleted list in the tooltip.
 */

@Component({
  selector: 'app-common-warning-icon',
  templateUrl: './common-warning-icon.component.html',
  styleUrls: ['./common-warning-icon.component.scss'],
  imports: [CommonModule, MatIcon, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonWarningIconComponent implements OnInit, OnChanges {
  @Input() warningMessageKeys: string[] = [];
  formattedWarningMessage = '';

  constructor(private translateService: TranslateService) {}

  ngOnInit() {
    this.updateFormattedMessage();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['warningMessageKeys']) {
      this.updateFormattedMessage();
    }
  }

  private updateFormattedMessage() {
    if (this.warningMessageKeys.length === 0) {
      this.formattedWarningMessage = '';
      return;
    }
    const translatedMessages = this.warningMessageKeys.map((key) => this.translateService.instant(key));

    if (translatedMessages.length === 1) {
      this.formattedWarningMessage = translatedMessages[0];
    } else {
      this.formattedWarningMessage = `• ${translatedMessages.join('\n• ')}`;
    }
  }
}
