import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';

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
// contentDetails = [
//   { key: 'name' },
//   { description: 'something' },
//   { tags: ['Tag1', 'Tag2'] },
//   { Appcontext: 'Context1' },
// ];
//
// Simply pass the data to the component as shown below:
// <app-common-section-card-content [data]="contentDetails"></app-common-section-card-content>
export class CommonSectionCardContentComponent implements OnChanges {
  @Input() data: { key: string; value: string }[] = [];
  keys: string[] = [];
  values: any[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes.data && this.data) {
      this.keys = this.data.map((item) => this.capitalizeKey(Object.keys(item)[0]));
      this.values = this.data.map((item) => Object.values(item)[0]);
    }
  }

  capitalizeKey(key: string): string {
    return key.charAt(0).toUpperCase() + key.slice(1);
  }
}
