import { Component } from '@angular/core';
import { CommonPageComponent } from '../../../../../shared-standalone-component-lib/components';
import { SegmentRootPageHeaderComponent } from './segment-root-page-header/segment-root-page-header.component';
import { SegmentRootPageContentComponent } from './segment-root-page-content/segment-root-page-content.component';

@Component({
  selector: 'app-segment-root-page',
  templateUrl: './segment-root-page.component.html',
  styleUrl: './segment-root-page.component.scss',
  imports: [CommonPageComponent, SegmentRootPageHeaderComponent, SegmentRootPageContentComponent],
})
export class SegmentRootPageComponent {}
