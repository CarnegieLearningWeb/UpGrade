import { DATE_RANGE } from 'upgrade_types';

export function getDateVariables(
  dateRange: DATE_RANGE,
  clientOffset: number,
  tableName: string
): { whereDate: string; selectRange: string } {
  let whereDate = '';
  let selectRange = '';
  const dateTruncString = dateRange === DATE_RANGE.TOTAL ? 'year' : 'month';
  switch (dateRange) {
    case DATE_RANGE.LAST_SEVEN_DAYS:
      whereDate = `"${tableName}"."createdAt" > current_date - interval '7 days'`;
      selectRange =
        `date_trunc('day', "${tableName}"."createdAt"::timestamptz at time zone 'UTC'
      + interval '` +
        clientOffset +
        ` minutes') AS date_range`;
      break;
    case DATE_RANGE.LAST_TWO_WEEKS:
      whereDate = `"${tableName}"."createdAt" > current_date - interval '14 days'`;
      selectRange =
        `date_trunc('day', "${tableName}"."createdAt"::timestamptz at time zone 'UTC'
      + interval '` +
        clientOffset +
        ` minutes') AS date_range`;
      break;
    case DATE_RANGE.LAST_ONE_MONTH:
      whereDate = `"${tableName}"."createdAt" > current_date - interval '30 days'`;
      selectRange =
        `date_trunc('day', "${tableName}"."createdAt"::timestamptz at time zone 'UTC'
      + interval '` +
        clientOffset +
        ` minutes') AS date_range`;
      break;
    case DATE_RANGE.LAST_THREE_MONTHS:
      whereDate = `"${tableName}"."createdAt" > current_date - interval '3 months'`;
      selectRange =
        `date_trunc('month', "${tableName}"."createdAt"::timestamptz at time zone 'UTC'
      + interval '` +
        clientOffset +
        ` minutes') AS date_range`;
      break;
    case DATE_RANGE.LAST_SIX_MONTHS:
      whereDate = `"${tableName}"."createdAt" > current_date - interval '6 months'`;
      selectRange =
        `date_trunc('month', "${tableName}"."createdAt"::timestamptz at time zone 'UTC'
      + interval '` +
        clientOffset +
        ` minutes') AS date_range`;
      break;
    case DATE_RANGE.LAST_TWELVE_MONTHS:
      whereDate = `"${tableName}"."createdAt" > current_date - interval '12 months'`;
      selectRange =
        `date_trunc('month', "${tableName}"."createdAt"::timestamptz at time zone 'UTC'
      + interval '` +
        clientOffset +
        ` minutes') AS date_range`;
      break;
    default:
      selectRange =
        `date_trunc('${dateTruncString}', "${tableName}"."createdAt"::timestamptz at time zone 'UTC'
      + interval '` +
        clientOffset +
        ` minutes') AS date_range`;
      break;
  }
  return { whereDate, selectRange };
}

export function getDateRangeNames(dateRange: DATE_RANGE, clientOffset: number, age: number): string[] {
  const dates = [];
  switch (dateRange) {
    case DATE_RANGE.LAST_SEVEN_DAYS:
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setTime(date.getTime() + (date.getTimezoneOffset() + clientOffset) * 60000);
        date.setDate(date.getDate() - i);
        const newDate = date.toDateString();
        dates.push(newDate);
      }
      break;
    case DATE_RANGE.LAST_TWO_WEEKS:
      for (let i = 0; i < 14; i++) {
        const date = new Date();
        date.setTime(date.getTime() + (date.getTimezoneOffset() + clientOffset) * 60000);
        date.setDate(date.getDate() - i);
        const newDate = date.toDateString();
        dates.push(newDate);
      }
      break;
    case DATE_RANGE.LAST_ONE_MONTH:
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setTime(date.getTime() + (date.getTimezoneOffset() + clientOffset) * 60000);
        date.setDate(date.getDate() - i);
        const newDate = date.toDateString();
        dates.push(newDate);
      }
      break;
    case DATE_RANGE.LAST_THREE_MONTHS:
      for (let i = 0; i < 3; i++) {
        const date = new Date();
        date.setTime(date.getTime() + (date.getTimezoneOffset() + clientOffset) * 60000);
        date.setDate(1);
        date.setMonth(date.getMonth() - i);
        const newDate = date.toDateString();
        dates.push(newDate);
      }
      break;
    case DATE_RANGE.LAST_SIX_MONTHS:
      for (let i = 0; i < 6; i++) {
        const date = new Date();
        date.setTime(date.getTime() + (date.getTimezoneOffset() + clientOffset) * 60000);
        date.setDate(1);
        date.setMonth(date.getMonth() - i);
        const newDate = date.toDateString();
        dates.push(newDate);
      }
      break;
    case DATE_RANGE.LAST_TWELVE_MONTHS:
      for (let i = 0; i < 12; i++) {
        const date = new Date();
        date.setTime(date.getTime() + (date.getTimezoneOffset() + clientOffset) * 60000);
        date.setDate(1);
        date.setMonth(date.getMonth() - i);
        const newDate = date.toDateString();
        dates.push(newDate);
      }
      break;
    default:
      for (let i = 0; i < age + 1; i++) {
        const date = new Date();
        date.setTime(date.getTime() + (date.getTimezoneOffset() + clientOffset) * 60000);
        date.setDate(1);
        date.setFullYear(date.getFullYear() - i);
        date.setMonth(0);
        const newDate = date.toDateString();
        dates.push(newDate);
      }

      break;
  }
  return dates;
}
