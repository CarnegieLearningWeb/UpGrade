import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatDate'
})
export class FormatDatePipe implements PipeTransform {
  transform(date: string): any {
    if (!!date) {
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
        'December'
      ];
      const dateNumber = experimentDate.getDate();
      const dateHours = experimentDate.getHours();
      return (
        dateNumber +
        this.getSuffix(dateNumber) +
        ' ' +
        months[experimentDate.getMonth()].substring(0, 3) +
        ', ' +
        (dateHours < 12 ? dateHours : dateHours - 12) +
        ':' +
        experimentDate.getMinutes() +
        ' ' +
        (experimentDate.getHours() < 12 ? 'AM' : 'PM')
      );
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
