import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { MatTableModule } from '@angular/material/table';
import { AsyncPipe, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { FeatureFlagsService } from '../../../../../../../../core/feature-flags/feature-flags.service';

@Component({
  selector: 'app-feature-flag-root-table-section-card-content-container',
  standalone: true,
  imports: [AsyncPipe, NgIf, MatTableModule, MatButtonModule],
  templateUrl: './feature-flag-root-table-section-card-content-container.component.html',
  styleUrl: './feature-flag-root-table-section-card-content-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagRootTableSectionCardContentContainerComponent {
  flags: Observable<any[]> = this.featureFlagsService.mockFeatureFlags$;
  isLoading: Observable<boolean> = this.featureFlagsService.isLoadingMockFeatureFlags$;
  displayedColumns: string[] = ['name'];

  constructor(public featureFlagsService: FeatureFlagsService) {
    this.featureFlagsService.fetchMockFeatureFlags();

    this.flags.subscribe((flags) => {
      console.log('flags', flags);
    });
  }
}
