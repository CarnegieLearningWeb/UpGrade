import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-feature-flag-exposures-data',
  templateUrl: './feature-flag-exposures-data.component.html',
  styleUrl: './feature-flag-exposures-data.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule],
})
export class FeatureFlagExposuresDataComponent {}
