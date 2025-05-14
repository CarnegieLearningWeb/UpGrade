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
 *   [isExpanded]="isTagsExpanded(id)"
 *   (expandedChange)="toggleTagExpansion(id)"
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
  @Input() isExpanded = false;
  @Output() expandedChange = new EventEmitter<boolean>();
  @Output() tagClick = new EventEmitter<string>();

  private readonly maxVisibleTags = 2;

  onTagClick(tag: string): void {
    this.tagClick.emit(tag);
  }

  get visibleTags(): string[] {
    if (this.isExpanded || this.tags.length <= this.maxVisibleTags) {
      return this.tags;
    }
    return this.tags.slice(0, this.maxVisibleTags);
  }

  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
    this.expandedChange.emit(this.isExpanded);
  }

  get hiddenTagsCount(): number {
    return this.tags.length - this.maxVisibleTags;
  }

  get shouldShowMoreChip(): boolean {
    return !this.isExpanded && this.tags.length > this.maxVisibleTags;
  }
}
