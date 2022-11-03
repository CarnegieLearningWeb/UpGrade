import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit: number, ellipsisLength = 3): string {
    return value && value.length > limit ? value.substring(0, limit) + '.'.repeat(ellipsisLength) : value;
  }
}
