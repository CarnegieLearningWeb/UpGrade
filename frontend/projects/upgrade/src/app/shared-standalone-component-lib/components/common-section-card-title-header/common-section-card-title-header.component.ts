import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

/**
 * The `app-common-section-card-search-header` component provides a common header with title and subtitle in section card.
 * It contains a title, subtitle, status chip and redirect link in subtitle.
 *
 * Example usage:
 *
 * ```
 * <app-common-section-card-title-header
 *   [title]="title"
 *   [subtitle]="subtitle"
 *   [link]="www.example.com"
 *   [linkText]="view more..."
 *   [chipText]="Disabled"
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
  @Input() link: string;
  @Input() linkText: string;
  @Input() chipText: string;

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

  // ngOnInit(): void {}
}
