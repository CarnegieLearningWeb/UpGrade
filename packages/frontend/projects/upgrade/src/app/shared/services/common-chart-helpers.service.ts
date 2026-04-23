import { Injectable } from '@angular/core';
import { DATE_RANGE } from 'upgrade_types';

export interface DateFilterOption {
  value: DATE_RANGE;
  viewValue: string;
}

export const DATE_FILTER_OPTIONS: DateFilterOption[] = [
  { value: DATE_RANGE.TOTAL, viewValue: 'Total' },
  { value: DATE_RANGE.LAST_SEVEN_DAYS, viewValue: 'Last 7 days' },
  { value: DATE_RANGE.LAST_TWO_WEEKS, viewValue: 'Last 2 weeks' },
  { value: DATE_RANGE.LAST_ONE_MONTH, viewValue: 'Last 1 month' },
  { value: DATE_RANGE.LAST_THREE_MONTHS, viewValue: 'Last 3 months' },
  { value: DATE_RANGE.LAST_SIX_MONTHS, viewValue: 'Last 6 months' },
  { value: DATE_RANGE.LAST_TWELVE_MONTHS, viewValue: 'Last 12 months' },
];

export const SINCE_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

@Injectable({
  providedIn: 'root',
})
export class CommonChartHelpersService {
  private subtractDays(baseDate: Date, days: number): Date {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - days);
    return date;
  }

  private subtractMonths(baseDate: Date, months: number): Date {
    const date = new Date(baseDate);
    date.setMonth(date.getMonth() - months);
    return date;
  }

  getDateFilterOptions(): DateFilterOption[] {
    return DATE_FILTER_OPTIONS.map((options) => ({ ...options }));
  }

  getDynamicTotalRange(startDate: Date | null): DATE_RANGE {
    if (!startDate) {
      return DATE_RANGE.LAST_SEVEN_DAYS;
    }

    const now = new Date();
    const effectiveStart = startDate > now ? now : startDate;

    const rangeBoundaries = [
      { range: DATE_RANGE.LAST_SEVEN_DAYS, cutoff: this.subtractDays(now, 7) },
      { range: DATE_RANGE.LAST_TWO_WEEKS, cutoff: this.subtractDays(now, 14) },
      { range: DATE_RANGE.LAST_ONE_MONTH, cutoff: this.subtractMonths(now, 1) },
      { range: DATE_RANGE.LAST_THREE_MONTHS, cutoff: this.subtractMonths(now, 3) },
      { range: DATE_RANGE.LAST_SIX_MONTHS, cutoff: this.subtractMonths(now, 6) },
      { range: DATE_RANGE.LAST_TWELVE_MONTHS, cutoff: this.subtractMonths(now, 12) },
    ];

    const matchedWindow = rangeBoundaries.find(({ cutoff }) => effectiveStart >= cutoff);
    return matchedWindow ? matchedWindow.range : DATE_RANGE.TOTAL;
  }

  formatXAxisLabel(effectiveDateFilter: DATE_RANGE, value: unknown): string {
    if (typeof value !== 'string') {
      return '';
    }
    if (
      effectiveDateFilter === DATE_RANGE.LAST_SEVEN_DAYS ||
      effectiveDateFilter === DATE_RANGE.LAST_TWO_WEEKS ||
      effectiveDateFilter === DATE_RANGE.LAST_ONE_MONTH
    ) {
      return value.substring(0, 5);
    } else if (effectiveDateFilter === DATE_RANGE.TOTAL) {
      return value.substring(0, 4);
    }
    return value.substring(0, 3);
  }

  formatYAxisLabel(value: number): string | number {
    return value % 1 !== 0 ? '' : value;
  }
}
