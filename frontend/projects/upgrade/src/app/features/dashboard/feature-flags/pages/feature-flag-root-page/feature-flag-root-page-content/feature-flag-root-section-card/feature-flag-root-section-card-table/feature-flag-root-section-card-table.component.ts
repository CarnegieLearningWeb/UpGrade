import { ChangeDetectionStrategy, Component, Input, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import {
  FLAG_ROOT_COLUMN_NAMES,
  FLAG_ROOT_DISPLAYED_COLUMNS,
  FLAG_TRANSLATION_KEYS,
  FeatureFlag,
} from '../../../../../../../../core/feature-flags/store/feature-flags.model';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AsyncPipe, NgIf, NgFor, UpperCasePipe, DatePipe, CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { CommonStatusIndicatorChipComponent } from '../../../../../../../../shared-standalone-component-lib/components';
import { FeatureFlagsService } from '../../../../../../../../core/feature-flags/feature-flags.service';

@Component({
  selector: 'app-feature-flag-root-section-card-table',
  standalone: true,
  imports: [
    MatTableModule,
    AsyncPipe,
    NgIf,
    NgFor,
    MatSortModule,
    MatTooltipModule,
    CommonModule,
    TranslateModule,
    UpperCasePipe,
    MatChipsModule,
    RouterModule,
    DatePipe,
    CommonStatusIndicatorChipComponent,
  ],
  templateUrl: './feature-flag-root-section-card-table.component.html',
  styleUrl: './feature-flag-root-section-card-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagRootSectionCardTableComponent implements OnInit {
  @Input() dataSource$: MatTableDataSource<FeatureFlag>;
  @Input() isLoading$: Observable<boolean>;
  flagSortKey$ = this.featureFlagsService.sortKey$;
  flagSortAs$ = this.featureFlagsService.sortAs$;

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(private featureFlagsService: FeatureFlagsService) {}

  ngOnInit() {
    if (this.dataSource$?.data) {
      this.dataSource$.sort = this.sort;
    }
  }

  get displayedColumns(): string[] {
    return FLAG_ROOT_DISPLAYED_COLUMNS;
  }

  get FLAG_TRANSLATION_KEYS() {
    return FLAG_TRANSLATION_KEYS;
  }

  get FLAG_ROOT_COLUMN_NAMES() {
    return FLAG_ROOT_COLUMN_NAMES;
  }

  fetchFlagsOnScroll() {
    console.log('fetchFlagsOnScroll');
  }

  changeSorting(event) {
    this.featureFlagsService.setSortingType(event.direction ? event.direction.toUpperCase() : null);
    this.featureFlagsService.setSortKey(event.direction ? event.active : null);
  }
}
