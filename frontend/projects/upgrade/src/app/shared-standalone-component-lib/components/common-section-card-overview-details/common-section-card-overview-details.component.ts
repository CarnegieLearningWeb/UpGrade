import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';

export interface KeyValueFormat {
  [key: string]: string | string[];
  Tags?: string[];
}

@Component({
  selector: 'app-common-section-card-overview-details',
  standalone: true,
  imports: [SharedModule],
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
  noSort = () => 0;
}
