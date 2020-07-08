import { LogDateFormatPipe } from './logs-date-format.pipe';
import { LogDateFormatType } from '../../../../core/logs/store/logs.model';

describe('LogDateFormatPipe', () => {
  const logDateFormatPipe = new LogDateFormatPipe();

  it('should return empty string with invalid input', () => {
    expect(logDateFormatPipe.transform('')).toBe('');
  });

  it('should return date and month for given date', () => {
    expect(logDateFormatPipe.transform('2020-07-05T17:46:45.527Z', LogDateFormatType.DATE_MONTH)).toBe('5th July');
  });

  it('should return year and day for given date', () => {
    expect(logDateFormatPipe.transform('2020-07-05T17:46:45.527Z', LogDateFormatType.YEAR_DAY)).toBe('2020, Sunday');
  });
});
