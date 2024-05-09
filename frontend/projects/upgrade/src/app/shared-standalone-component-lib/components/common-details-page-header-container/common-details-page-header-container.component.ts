import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
/**
 * Takes a title and subtitle and displays them in a header in a common details page.
 *
 * Example usage:
 *
 * ```
 * <app-common-details-page-header-container
 *    [rootName]="Experiments"
 *    [detailsName]="Simple Experiment 1"
 *    [rootLink]="/home"
 * ></app-common-details-page-header-container>
 * ```
 */
@Component({
  selector: 'app-common-details-page-header-container',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatButton, RouterModule],
  templateUrl: './common-details-page-header-container.component.html',
  styleUrl: './common-details-page-header-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonDetailsPageHeaderContainerComponent {
  @Input() rootName!: string;
  @Input() detailsName!: string;
  @Input() rootLink?: string;

  constructor() {
    // If feature_root_link is not provided, use feature as its value
    if (!this.rootLink) {
      this.rootLink = this.rootName;
    }
  }
}
