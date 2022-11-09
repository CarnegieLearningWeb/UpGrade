import { Pipe, PipeTransform } from '@angular/core';
import { REPEATED_MEASURE } from 'upgrade_types';

@Pipe({
  name: 'repeatedMeasure',
})
export class RepeatedMeasurePipe implements PipeTransform {
  transform(type: REPEATED_MEASURE): string {
    switch (type) {
      case REPEATED_MEASURE.earliest:
        return 'Earliest';
      case REPEATED_MEASURE.mean:
        return 'Mean';
      case REPEATED_MEASURE.mostRecent:
        return 'Most recent';
      default:
        return '';
    }
  }
}
