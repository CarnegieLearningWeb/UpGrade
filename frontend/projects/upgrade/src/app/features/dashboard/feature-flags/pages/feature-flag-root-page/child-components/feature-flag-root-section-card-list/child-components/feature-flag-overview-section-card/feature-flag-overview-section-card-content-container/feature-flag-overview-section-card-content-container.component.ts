import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeatureFlagsService } from '../../../../../../../../../../core/feature-flags/feature-flags.service';
import { Observable } from 'rxjs/internal/Observable';
import { MatTableModule } from '@angular/material/table';
import { AsyncPipe, NgIf } from '@angular/common';

@Component({
  selector: 'app-feature-flag-overview-section-card-content-container',
  standalone: true,
  imports: [MatTableModule, AsyncPipe, NgIf],
  templateUrl: './feature-flag-overview-section-card-content-container.component.html',
  styleUrl: './feature-flag-overview-section-card-content-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagOverviewSectionCardContentContainerComponent {
  flags: Observable<any[]> = this.featureFlagsService.featureFlags$;
  isLoading: Observable<boolean> = this.featureFlagsService.isLoadingFeatureFlags$;
  displayedColumns: string[] = ['name'];

  constructor(public featureFlagsService: FeatureFlagsService) {
    this.featureFlagsService.fetchFeatureFlags();

    this.flags.subscribe((flags) => {
      console.log('flags', flags);
    });
  }
}
