import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';
import isEqual from 'lodash.isequal';

/**
 * The `app-common-section-card-search-header` component provides a common header with search and filter options for search functionality.
 * It contains a dropdown to select a filter option and an input field to enter the search text.
 * The component emits a `search` event with the selected filter option and search value.
 *
 * Example usage:
 *
 * ```
 * <app-common-section-card-search-header
 *   [filterOptions]="[{ value: 'Name' }, { value: 'Status' }, { value: 'Context' }]"
 *   [searchString]="'Experiment 1'"
 *   [searchKey]="'Name'"
 *   (search)="onSearch($event)"
 * ></app-common-section-card-search-header>
 * ```
 *
 *  * Example usage with dropdown:
 *
 * ```
 * <app-common-section-card-search-header
 *   [filterOptions]="[{ value: 'Name', type: 'dropdown', valueOptions: ['Option1', 'Option2'] }, { value: 'Status' }, { value: 'Context' }]"
 *   [searchString]="'Experiment 1'"
 *   [searchKey]="'Name'"
 *   (search)="onSearch($event)"
 * ></app-common-section-card-search-header>
 * ```
 */

export interface CommonSearchWidgetSearchParams<SearchKeyType> {
  searchKey: SearchKeyType | string;
  searchString: string;
}

export interface FilterOption {
  value: string;
  type?: string;
  valueOptions?: string[];
  group?: string;
}

@Component({
  selector: 'app-common-section-card-search-header',
  templateUrl: './common-section-card-search-header.component.html',
  styleUrls: ['./common-section-card-search-header.component.scss'],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatIconModule,
    FormsModule,
    TranslateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonSectionCardSearchHeaderComponent implements OnChanges {
  @Input() filterOptions: FilterOption[] = [];
  @Input() searchString: string;
  @Input() searchKey: string;
  @Output() search = new EventEmitter<CommonSearchWidgetSearchParams<string>>();

  standaloneOptions: FilterOption[] = [];
  groupedOptions: { groupName: string; options: FilterOption[] }[] = [];

  // if filterOptions have changed, rebuild the options
  ngOnChanges(changes: SimpleChanges): void {
    const filterOptionsChange = changes['filterOptions'];
    if (filterOptionsChange && !filterOptionsChange.firstChange) {
      if (!isEqual(filterOptionsChange.previousValue, filterOptionsChange.currentValue)) {
        this.rebuildOptions();
      }
    }
  }

  onSearch(): void {
    this.search.emit({
      searchKey: this.searchKey,
      searchString: this.searchString,
    });
  }

  get filterOptionsValues(): string[] {
    return this.filterOptions.map((option) => option.value);
  }

  get filteredStatusOptions(): string[] {
    return this.filterOptions.find((option) => option.value === this.searchKey)?.valueOptions || [];
  }

  get isDropdown(): boolean {
    return this.filterOptions.find((option) => option.value === this.searchKey)?.type === 'dropdown';
  }

  private rebuildOptions(): void {
    // Cache standalone options
    this.standaloneOptions = this.filterOptions.filter((option) => !option.group && option.type !== 'group');

    // Cache grouped options
    const groups = new Map<string, FilterOption[]>();

    this.filterOptions.forEach((option) => {
      if (option.group) {
        if (!groups.has(option.group)) {
          groups.set(option.group, []);
        }
        const groupOptions = groups.get(option.group);
        if (groupOptions) {
          groupOptions.push(option);
        }
      }
    });

    this.groupedOptions = Array.from(groups.entries()).map(([groupName, options]) => ({ groupName, options }));
  }
}
