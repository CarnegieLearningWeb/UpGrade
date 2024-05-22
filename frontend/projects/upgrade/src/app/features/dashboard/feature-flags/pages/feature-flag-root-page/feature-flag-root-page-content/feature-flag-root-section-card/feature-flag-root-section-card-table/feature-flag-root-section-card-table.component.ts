import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import {
  FLAG_ROOT_COLUMN_NAMES,
  FLAG_ROOT_DISPLAYED_COLUMNS,
  FLAG_TRANSLATION_KEYS,
  FeatureFlag,
} from '../../../../../../../../core/feature-flags/store/feature-flags.model';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AsyncPipe, NgIf, NgFor, UpperCasePipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-feature-flag-root-section-card-table',
  standalone: true,
  imports: [MatTableModule, AsyncPipe, NgIf, NgFor, MatTooltipModule, TranslateModule, UpperCasePipe, MatChipsModule],
  templateUrl: './feature-flag-root-section-card-table.component.html',
  styleUrl: './feature-flag-root-section-card-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagRootSectionCardTableComponent {
  @Input() dataSource$: MatTableDataSource<FeatureFlag[]>;
  @Input() isLoading$: Observable<boolean>;

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

  changeSorting($event) {
    console.log('onSearch:', $event);
  }
}
