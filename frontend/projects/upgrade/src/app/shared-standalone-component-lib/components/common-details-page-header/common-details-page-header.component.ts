import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
/**
 * Takes a rootName, detailsName and rootLink and displays them in a header in a common details page.
 *
 * Example usage:
 *
 * ```
 * <app-common-details-page-header
 *    [rootName]="Experiments"
 *    [detailsName]="Simple Experiment 1"
 *    [rootLink]="home"
 * ></app-common-details-page-header>
 * ```
 */
@Component({
  selector: 'app-common-details-page-header',
  imports: [CommonModule, TranslateModule, MatButton, RouterModule],
  templateUrl: './common-details-page-header.component.html',
  styleUrl: './common-details-page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonDetailsPageHeaderComponent {
  @Input() rootName!: string;
  @Input() detailsName!: string;
  @Input() rootLink!: string;
}
