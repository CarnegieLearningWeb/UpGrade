import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';

/**
 * The `app-common-section-card-search-header` component provides a common header with search and filter options for search functionality.
 * It contains a dropdown to select a filter option and an input field to enter the search text.
 * The component emits a `search` event with the selected filter option and search value.
 *
 * Example usage:
 *
 * ```
 * <app-common-section-card-search-header
 *   [filterOptions]="['Name', 'Status', 'Context']"
 *   [initialSearchValue]="'Experiment 1'"
 *   [initialFilterOption]="'Name'"
 *   (search)="onSearch($event)"
 * ></app-common-section-card-search-header>
 * ```
 */

@Component({
  standalone: true,
  selector: 'app-common-section-card-search-header',
  templateUrl: './common-section-card-search-header.component.html',
  styleUrls: ['./common-section-card-search-header.component.scss'],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    FormsModule,
    TranslateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonSectionCardSearchHeaderComponent implements OnInit {
  @Input() filterOptions: string[] = [];
  @Input() initialSearchValue = '';
  @Input() initialFilterOption = '';
  @Output() search = new EventEmitter<{ filterOption: string; searchValue: string }>();

  selectedFilterOption = '';
  searchValue = '';

  ngOnInit(): void {
    if (this.initialSearchValue) {
      this.searchValue = this.initialSearchValue;
    }
    if (this.filterOptions.length > 0) {
      this.selectedFilterOption = this.initialFilterOption;
    }
  }

  onSearch(): void {
    this.search.emit({
      filterOption: this.selectedFilterOption,
      searchValue: this.searchValue,
    });
  }
}
