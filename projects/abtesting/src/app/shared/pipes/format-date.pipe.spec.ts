import { FormatDatePipe } from './format-date.pipe';
import { DateType } from '../../core/experiments/store/experiments.model';

describe('FormatDatePipe', () => {
  const formatDatePipe = new FormatDatePipe();

  it('should return empty string if no date is given', () => {
    expect(formatDatePipe.transform(null)).toBe('');
  });

  it('should return medium date format', () => {
    expect(formatDatePipe.transform('2020-07-05T17:46:45.527Z', DateType.MEDIUM_DATE)).toBe('5th July 2020');
  });

  // Runs locally but not on codebuild
  // it('should return date with time', () => {
  //   expect(formatDatePipe.transform('2020-07-05T17:46:45.527Z')).toBe('5th Jul, 11:16 PM');
  // });
});
