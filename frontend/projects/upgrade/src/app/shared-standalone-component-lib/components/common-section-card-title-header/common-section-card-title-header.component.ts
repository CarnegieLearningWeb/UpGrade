import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

/**
 * The `app-common-section-card-search-header` component provides a common header with title and subtitle in section card.
 * It contains a title, subtitle, status chip Text and variable to confirm if it should contain view Log text anchor tag.
 * It will emit event when view Log text will be clicked which will notify parent component of getting clicked.
 * Example usage:
 *
 * ```
 * <app-common-section-card-title-header
 *   [title]="title"
 *   [subtitle]="subtitle"
 *   [showViewLogs]="true"
 *   [chipText]="Disabled"
 *   (viewLogs)="viewLogsClicked($event)"
 * ></app-common-section-card-title-header>
 * ```
 */

enum ChipColor {
  Primary = 'primary',
  Accent = 'accent',
  Warn = 'warn',
}

@Component({
  standalone: true,
  selector: 'app-common-section-card-title-header',
  templateUrl: './common-section-card-title-header.component.html',
  styleUrls: ['./common-section-card-title-header.component.scss'],
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonSectionCardTitleHeaderComponent {
  @Input() title!: string;
  @Input() subtitle!: string;
  @Input() chipText?: string;
  @Input() showViewLogs?: boolean;
  @Output() viewLogs = new EventEmitter<{ clicked: boolean }>();

  getChipColor(text: string): string {
    switch (text.toLowerCase()) {
      case 'primary':
        return ChipColor.Primary;
      case 'accent':
        return ChipColor.Accent;
      case 'warn':
        return ChipColor.Warn;
      default:
        return '';
    }
  }

  viewLogsClicked(): void {
    this.viewLogs.emit({
      clicked: true,
    });
  }
  // ngOnInit(): void {}
}
