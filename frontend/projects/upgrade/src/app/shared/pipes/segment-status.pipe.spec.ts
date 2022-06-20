import { SEGMENT_STATUS } from 'upgrade_types';
import { SegmentStatusPipe, SegmentStatusPipeType } from './segment-status.pipe';

describe('ExperimentStatePipe', () => {
  const segmentStatusPipe = new SegmentStatusPipe();

  it('should return #ff0000 color for Used Status', () => {
    expect(segmentStatusPipe.transform(SEGMENT_STATUS.USED, SegmentStatusPipeType.COLOR)).toBe('#000');
  });

  it('should return #d8d8d8 color for Unused Status', () => {
    expect(segmentStatusPipe.transform(SEGMENT_STATUS.UNUSED, SegmentStatusPipeType.COLOR)).toBe('#d8d8d8');
  });

  it('should return #0cdda5 color for Global Status', () => {
    expect(segmentStatusPipe.transform(SEGMENT_STATUS.GLOBAL, SegmentStatusPipeType.COLOR)).toBe('#ff0000');
  });

  it('should return #0cdda5 color for Locked Status', () => {
    expect(segmentStatusPipe.transform(SEGMENT_STATUS.LOCKED, SegmentStatusPipeType.COLOR)).toBe('#0cdda5');
  });

  it('should return #d8d8d8 color for Unlocked Status', () => {
    expect(segmentStatusPipe.transform(SEGMENT_STATUS.UNLOCKED, SegmentStatusPipeType.COLOR)).toBe('#ff0000');
  });

});
