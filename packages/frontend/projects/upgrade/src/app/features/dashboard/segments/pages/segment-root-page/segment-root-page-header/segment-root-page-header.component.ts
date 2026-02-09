import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonRootPageHeaderComponent } from '../../../../../../shared-standalone-component-lib/components';

@Component({
  selector: 'app-segment-root-page-header',
  imports: [CommonRootPageHeaderComponent],
  templateUrl: './segment-root-page-header.component.html',
  styleUrl: './segment-root-page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentRootPageHeaderComponent {}
