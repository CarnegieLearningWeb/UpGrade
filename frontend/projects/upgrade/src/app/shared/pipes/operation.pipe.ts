import { Pipe, PipeTransform } from '@angular/core';
import { OPERATION_TYPES } from 'upgrade_types';

@Pipe({
  name: 'operationType',
})
export class OperationPipe implements PipeTransform {
  transform(operationType: OPERATION_TYPES | string): string {
    switch (operationType) {
      case OPERATION_TYPES.AVERAGE:
        return 'Mean';
      case OPERATION_TYPES.COUNT:
        return 'Count';
      case OPERATION_TYPES.MAX:
        return 'Max';
      case OPERATION_TYPES.MEDIAN:
        return 'Median';
      case OPERATION_TYPES.MIN:
        return 'Min';
      case OPERATION_TYPES.MODE:
        return 'Mode';
      case OPERATION_TYPES.STDEV:
        return 'Standard Deviation';
      case OPERATION_TYPES.SUM:
        return 'Sum';
      case OPERATION_TYPES.PERCENTAGE:
        return 'Percentage';
      default:
        return '';
    }
  }
}
