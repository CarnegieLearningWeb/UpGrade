import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-feature-flag-exposures-data',
  templateUrl: './feature-flag-exposures-data.component.html',
  styleUrl: './feature-flag-exposures-data.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
})
export class FeatureFlagExposuresDataComponent {}
