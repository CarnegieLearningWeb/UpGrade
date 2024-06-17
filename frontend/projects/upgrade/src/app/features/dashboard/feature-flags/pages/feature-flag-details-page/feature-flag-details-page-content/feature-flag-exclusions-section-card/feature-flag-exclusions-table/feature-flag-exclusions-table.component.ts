import { AsyncPipe, NgIf, NgFor, UpperCasePipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonStatusIndicatorChipComponent } from '../../../../../../../../shared-standalone-component-lib/components';

import { FeatureFlagsService } from '../../../../../../../../core/feature-flags/feature-flags.service';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-feature-flag-exclusions-table',
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
    MatSlideToggleModule,
    MatIconModule,
    MatButtonModule,
    CommonStatusIndicatorChipComponent,
  ],
  templateUrl: './feature-flag-exclusions-table.component.html',
  styleUrl: './feature-flag-exclusions-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagExclusionsTableComponent {
  @Input() dataSource$ = this.featureFlagService.selectFeatureFlagExclusions$;
  isLoading$ = this.featureFlagService.isLoadingFeatureFlags$;

  constructor(private featureFlagService: FeatureFlagsService) {}

  get displayedColumns(): string[] {
    return ['name', 'type', 'status', 'actions'];
  }

  get FLAG_INCLUSIONS_TABLE_COLUMN_NAMES() {
    return {
      NAME: 'Name',
      TYPE: 'Type',
      STATUS: 'Status',
      ACTIONS: 'Actions',
    };
  }

  fetchFlagsOnScroll() {
    console.log('fetchFlagsOnScroll');
  }

  changeSorting($event) {
    console.log('onSearch:', $event);
  }
}
