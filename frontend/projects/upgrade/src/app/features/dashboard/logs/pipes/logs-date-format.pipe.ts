import { Pipe, PipeTransform } from '@angular/core';
import { LogDateFormatType } from '../../../../core/logs/store/logs.model';

@Pipe({
  name: 'logDateFormatPipe',
})
export class LogDateFormatPipe implements PipeTransform {
  transform(date: string, type?: any): any {
    if (date) {
      const logDate = new Date(date);
      const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dateNumber = logDate.getDate();
      const dateYear = logDate.getFullYear();

      if (type === LogDateFormatType.DATE_MONTH) {
        return dateNumber + this.getSuffix(dateNumber) + ' ' + months[logDate.getMonth()];
      } else {
        const dayIndex = logDate.getDay();
        return dateYear + ', ' + days[dayIndex];
      }
    } else {
      return '';
    }
  }

  private getSuffix(dayIndex): string {
    if (dayIndex > 3 && dayIndex < 21) return 'th';
    switch (dayIndex % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  }
}
