import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonRootPageHeaderContainerComponent } from '../../../../../../shared-standalone-component-lib/components/';
import { AppState } from '../../../../../../core/core.state';
import { Store } from '@ngrx/store';
import { FeatureFlagsService } from '../../../../../../core/feature-flags/feature-flags.service';

@Component({
  selector: 'app-feature-flag-root-page-header',
  standalone: true,
  imports: [CommonRootPageHeaderContainerComponent],
  templateUrl: './feature-flag-root-page-header.component.html',
  styleUrl: './feature-flag-root-page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagRootPageHeaderComponent {
  constructor(private store$: Store<AppState>, private featureFlagsService: FeatureFlagsService) {}

  ngOnInit() {
    this.featureFlagsService.fetchFeatureFlags(true);
  }
}
