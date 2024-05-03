import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Takes a title and subtitle and displays them in a header in a common root page.
 *
 * Example usage:
 *
 * ```
 * <app-common-root-page-header-container [title]="title" [subtitle]="subtitle"></app-common-root-page-header-container>
 * ```
 */
@Component({
  selector: 'app-common-root-page-header-container',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatButton],
  templateUrl: './common-root-page-header-container.component.html',
  styleUrl: './common-root-page-header-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonRootPageHeaderContainerComponent {
  @Input() title!: string;
  @Input() subtitle!: string;
}
