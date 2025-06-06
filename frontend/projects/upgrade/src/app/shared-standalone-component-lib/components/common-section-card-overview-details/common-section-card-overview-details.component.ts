import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { CommonTagListComponent } from '../common-tag-list/common-tag-list.component';

export interface KeyValueFormat {
  [key: string]: string | string[];
  Tags?: string[];
}

@Component({
  selector: 'app-common-section-card-overview-details',
  imports: [SharedModule, CommonTagListComponent],
  templateUrl: './common-section-card-overview-details.component.html',
  styleUrl: './common-section-card-overview-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

// This component processes the provided data and splits it into two arrays: 'keys' and 'values'.
// It then maps and displays the content from these arrays.
//
// Example Usage:
//
// contentDetails = {
//   ['Key']: 'name',
//   ['Description']: 'something',
//   ['Tags']: ['Tag1', 'Tag2'],
//   ['App Context']: 'Context1',
// };
//
// Simply pass the data to the component as shown below:
// <app-common-section-card-content [data]="contentDetails"></app-common-section-card-content>
export class CommonSectionCardOverviewDetailsComponent {
  @Input() data!: KeyValueFormat;
  @Output() tagItemClick = new EventEmitter<string>();
  noSort = () => 0;

  searchByTag(tag: string): void {
    this.tagItemClick.emit(tag);
  }
}
