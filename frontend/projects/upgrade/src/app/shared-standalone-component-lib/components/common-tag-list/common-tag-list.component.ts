import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { MatChipsModule } from '@angular/material/chips';
import { CommonTagComponent } from '../common-tag/common-tag.component';

/**
 * CommonTagListComponent provides a consistent way to display a list of tags
 * throughout the application.
 *
 * Example usage:
 * ```html
 * <app-common-tag-list
 *   [tags]="tags"
 *   (tagClick)="handleTagClick($event)">
 * </app-common-tag-list>
 * ```
 */
@Component({
  selector: 'app-common-tag-list',
  imports: [CommonModule, SharedModule, MatChipsModule, CommonTagComponent],
  templateUrl: './common-tag-list.component.html',
  styleUrls: ['./common-tag-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonTagListComponent {
  @Input() tags: string[] = [];
  @Input() ariaLabel = 'Tags';
  @Output() tagClick = new EventEmitter<string>();

  onTagClick(tag: string): void {
    this.tagClick.emit(tag);
  }
}
