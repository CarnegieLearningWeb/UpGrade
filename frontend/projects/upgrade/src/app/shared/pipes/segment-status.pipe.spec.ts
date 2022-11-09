import { SEGMENT_STATUS } from 'upgrade_types';
import { SegmentStatusPipe, SegmentStatusPipeType } from './segment-status.pipe';

describe('ExperimentStatePipe', () => {
  const segmentStatusPipe = new SegmentStatusPipe();

  it('should return #829CF8 color for Used Status', () => {
    expect(segmentStatusPipe.transform(SEGMENT_STATUS.USED, SegmentStatusPipeType.COLOR)).toBe('#829CF8');
  });

  it('should return #D8D8D8 color for Unused Status', () => {
    expect(segmentStatusPipe.transform(SEGMENT_STATUS.UNUSED, SegmentStatusPipeType.COLOR)).toBe('#D8D8D8');
  });

  it('should return #FD9099 color for Global Status', () => {
    expect(segmentStatusPipe.transform(SEGMENT_STATUS.GLOBAL, SegmentStatusPipeType.COLOR)).toBe('#FD9099');
  });

  it('should return #0CDDA5 color for Locked Status', () => {
    expect(segmentStatusPipe.transform(SEGMENT_STATUS.LOCKED, SegmentStatusPipeType.COLOR)).toBe('#0CDDA5');
  });

  it('should return #829CF8 color for Unlocked Status', () => {
    expect(segmentStatusPipe.transform(SEGMENT_STATUS.UNLOCKED, SegmentStatusPipeType.COLOR)).toBe('#829CF8');
  });
});
