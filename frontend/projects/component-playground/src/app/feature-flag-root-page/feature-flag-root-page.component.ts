import { Component } from '@angular/core';
import { CommonRootPageComponent } from '@upgrade/src/app/shared-standalone-component-lib/components';
import { SectionCardExampleComponent } from '../section-card-example/section-card-example.component';

@Component({
  selector: 'app-feature-flag-root-page',
  standalone: true,
  imports: [CommonRootPageComponent, SectionCardExampleComponent],
  templateUrl: './feature-flag-root-page.component.html',
  styleUrl: './feature-flag-root-page.component.scss',
})
export class FeatureFlagRootPageComponent {}
