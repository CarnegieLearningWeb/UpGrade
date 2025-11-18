import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * The `app-common-warning-icon` component provides a common warning icon with a tooltip if provided with a message.
 * It displays a warning_amber Material icon with a tooltip when hovered.
 *
 * Example usage:
 *
 * ```html
 * <app-common-warning-icon
 *   [warningMessage]="'This is a warning message'"
 * ></app-common-warning-icon>
 * ```
 */

@Component({
  selector: 'app-common-warning-icon',
  templateUrl: './common-warning-icon.component.html',
  styleUrls: ['./common-warning-icon.component.scss'],
  imports: [CommonModule, MatIcon, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonWarningIconComponent {
  @Input() warningMessage?: string = '';
}
