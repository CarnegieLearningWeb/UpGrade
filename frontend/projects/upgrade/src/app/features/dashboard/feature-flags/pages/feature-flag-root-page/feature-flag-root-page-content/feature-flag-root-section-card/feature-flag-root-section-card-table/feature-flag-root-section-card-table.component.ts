import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import {
  FLAG_ROOT_COLUMN_NAMES,
  FLAG_ROOT_DISPLAYED_COLUMNS,
  FLAG_TRANSLATION_KEYS,
  FeatureFlag,
} from '../../../../../../../../core/feature-flags/store/feature-flags.model';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AsyncPipe, NgIf, NgFor, UpperCasePipe, DatePipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';
import { CommonStatusIndicatorChipComponent } from '../../../../../../../../shared-standalone-component-lib/components';
import { SharedModule } from '../../../../../../../../shared/shared.module';
import { FeatureFlagsService } from '../../../../../../../../core/feature-flags/feature-flags.service';

@Component({
  selector: 'app-feature-flag-root-section-card-table',
  standalone: true,
  imports: [
    MatTableModule,
    AsyncPipe,
    NgIf,
    NgFor,
    MatTooltipModule,
    TranslateModule,
    UpperCasePipe,
    MatChipsModule,
    RouterModule,
    DatePipe,
    CommonStatusIndicatorChipComponent,
    SharedModule,
  ],
  templateUrl: './feature-flag-root-section-card-table.component.html',
  styleUrl: './feature-flag-root-section-card-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagRootSectionCardTableComponent implements OnInit, OnDestroy {
  @Input() dataSource$: MatTableDataSource<FeatureFlag[]>;
  @Input() isLoading$: Observable<boolean>;

  isAllFeaturFlagFetched = false;
  isAllFeatureFlagsFetchedSub = new Subscription();

  constructor(private featureFlagsService: FeatureFlagsService) {}

  ngOnInit(): void {
    this.isAllFeatureFlagsFetchedSub = this.featureFlagsService.isAllFlagsFetched$.subscribe(
      (value) => (this.isAllFeaturFlagFetched = value)
    );
  }

  fetchFlagsOnScroll() {
    if (!this.isAllFeaturFlagFetched) {
      this.featureFlagsService.fetchFeatureFlags();
    }
  }

  changeSorting($event) {
    console.log('onSearch:', $event);
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

  ngOnDestroy(): void {
    this.isAllFeatureFlagsFetchedSub.unsubscribe();
  }
}
