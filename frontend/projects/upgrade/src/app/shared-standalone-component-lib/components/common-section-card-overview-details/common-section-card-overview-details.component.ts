import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { CommonTagListComponent } from '../common-tag-list/common-tag-list.component';
import { EXPERIMENT_OVERVIEW_LABELS } from '../../../core/experiments/store/experiments.model';

export interface KeyValueFormat {
  [key: string]: string | string[] | BullettedListKeyValueFormat[];
  [EXPERIMENT_OVERVIEW_LABELS.TAGS]?: string[];
  [EXPERIMENT_OVERVIEW_LABELS.ADAPTIVE_ALGORITHM_PARAMETERS]?: BullettedListKeyValueFormat[];
}

export interface BullettedListKeyValueFormat {
  labelKey: string;
  value: number;
}

/**
 * CommonSectionCardOverviewDetailsComponent displays key-value pairs in a consistent
 * overview details format. It handles both simple string values and array values,
 * with special support for displaying tags and bulleted lists.
 *
 * Example usage:
 * ```typescript
 * contentDetails = {
 *   ['Name']: 'My Experiment',
 *   ['Description']: 'Experiment description',
 *   ['Tags']: ['Tag1', 'Tag2'],
 *   ['App Context']: 'Context1',
 *   ['Adaptive Algorithm Parameters']: ['Param1', 'Param2', 'Param3'],
 * };
 * ```
 * ```html
 * <app-common-section-card-overview-details
 *   [data]="contentDetails"
 *   [bullettedListKeys]="['Adaptive Algorithm Parameters']"
 *   (tagItemClick)="handleTagClick($event)">
 * </app-common-section-card-overview-details>
 * ```
 */
@Component({
  selector: 'app-common-section-card-overview-details',
  imports: [SharedModule, CommonTagListComponent],
  templateUrl: './common-section-card-overview-details.component.html',
  styleUrl: './common-section-card-overview-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonSectionCardOverviewDetailsComponent {
  @Input() data!: KeyValueFormat;
  @Input() bullettedListKeys: string[] = [];
  @Output() tagItemClick = new EventEmitter<string>();

  experimentOverviewLabels = EXPERIMENT_OVERVIEW_LABELS;
  noSort = () => 0;

  searchByTag(tag: string): void {
    this.tagItemClick.emit(tag);
  }
}
