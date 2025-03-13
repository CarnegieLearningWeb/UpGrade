import { Component } from '@angular/core';
import { CommonPageComponent } from '../../../../../shared-standalone-component-lib/components';
import { SegmentDetailsPageHeaderComponent } from './segment-details-page-header/segment-details-page-header.component';
import { SegmentDetailsPageContentComponent } from './segment-details-page-content/segment-details-page-content.component';

@Component({
  selector: 'app-segment-details-page',
  templateUrl: './segment-details-page.component.html',
  styleUrl: './segment-details-page.component.scss',
  imports: [CommonPageComponent, SegmentDetailsPageHeaderComponent, SegmentDetailsPageContentComponent],
})
export class SegmentDetailsPageComponent {}
