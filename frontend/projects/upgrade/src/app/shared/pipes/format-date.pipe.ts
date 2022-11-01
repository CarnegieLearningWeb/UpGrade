import { Pipe, PipeTransform } from '@angular/core';
import { DateType } from '../../core/experiments/store/experiments.model';

@Pipe({
  name: 'formatDate',
})
export class FormatDatePipe implements PipeTransform {
  transform(date: string, type?: DateType): any {
    if (date) {
      const experimentDate = new Date(date);
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
      const dateNumber = experimentDate.getDate();
      const dateHours = experimentDate.getHours();

      if (type === DateType.MEDIUM_DATE) {
        return (
          dateNumber +
          this.getSuffix(dateNumber) +
          ' ' +
          months[experimentDate.getMonth()] +
          ' ' +
          experimentDate.getFullYear()
        );
      } else {
        return (
          dateNumber +
          this.getSuffix(dateNumber) +
          ' ' +
          months[experimentDate.getMonth()].substring(0, 3) +
          ', ' +
          (dateHours < 10 || dateHours === 12 ? '0' : '') +
          (dateHours < 12 ? dateHours : dateHours - 12) +
          ':' +
          (experimentDate.getMinutes() < 10 ? '0' : '') +
          experimentDate.getMinutes() +
          ' ' +
          (experimentDate.getHours() < 12 ? 'AM' : 'PM')
        );
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
