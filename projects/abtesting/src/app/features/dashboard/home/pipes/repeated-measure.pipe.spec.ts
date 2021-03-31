import { RepeatedMeasurePipe } from './repeated-measure.pipe';
import { REPEATED_MEASURE } from 'upgrade_types';

describe('RepeatedMeasurePipe', () => {
  const repeatedMeasurePipe = new RepeatedMeasurePipe();

  it('should return Earliest when repeated measure is earliest', () => {
    expect(repeatedMeasurePipe.transform(REPEATED_MEASURE.earliest)).toBe('Earliest');
  });

  it('should return Mean when repeated measure is mean', () => {
    expect(repeatedMeasurePipe.transform(REPEATED_MEASURE.mean)).toBe('Mean');
  });

  it('should return Most recent when repeated measure is mostRecent ', () => {
    expect(repeatedMeasurePipe.transform(REPEATED_MEASURE.mostRecent)).toBe('Most recent');
  });

  it('should return empty string when repeated measure is other than enum', () => {
    expect(repeatedMeasurePipe.transform('' as any)).toBe('');
  });
});
