import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { KeyValueFormat } from 'upgrade_types';

@Component({
  selector: 'app-common-section-card-content',
  standalone: true,
  //Here imported SharedModule which exports CommonModule and MatChipModule
  imports: [SharedModule],
  templateUrl: './common-section-card-content.component.html',
  styleUrl: './common-section-card-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

// This component processes the provided data and splits it into two arrays: 'keys' and 'values'.
// It then maps and displays the content from these arrays.
//
// Example Usage:
//
// contentDetails = {
//   Key: 'name',
//   Description: 'something',
//   Tags: ['Tag1', 'Tag2'],
//   app_Context: 'Context1',
// };
//
// Simply pass the data to the component as shown below:
// <app-common-section-card-content [data]="contentDetails"></app-common-section-card-content>
export class CommonSectionCardContentComponent {
  @Input() data!: KeyValueFormat;

  objectKeys(obj: KeyValueFormat): string[] {
    return Object.keys(obj);
  }
}
