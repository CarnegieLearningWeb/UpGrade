import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SharedModule } from '../../../shared/shared.module';
import { MatChipsModule } from '@angular/material/chips';

/**
 * CommonTagComponent provides a consistent way to display individual tag chips
 * throughout the application with proper truncation and tooltips.
 *
 * Example usage:
 * ```html
 * <app-common-tag
 *   [tag]="tag"
 *   (tagClick)="handleTagClick($event)">
 * </app-common-tag>
 * ```
 */
@Component({
  selector: 'app-common-tag',
  imports: [CommonModule, MatTooltipModule, SharedModule, MatChipsModule],
  templateUrl: './common-tag.component.html',
  styleUrls: ['./common-tag.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonTagComponent {
  @Input() tag = '';
  @Output() tagClick = new EventEmitter<string>();

  onTagClick(): void {
    this.tagClick.emit(this.tag);
  }
}
