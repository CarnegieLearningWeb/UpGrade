import { Pipe, PipeTransform } from '@angular/core';
import { SEGMENT_STATUS } from '../../core/segments/store/segments.model';

export enum SegmentStatusPipeType {
  TEXT = 'text',
  COLOR = 'color',
}

@Pipe({
  name: 'segmentStatus',
})
export class SegmentStatusPipe implements PipeTransform {
  transform(segmentStatus: SEGMENT_STATUS, type: SegmentStatusPipeType = SegmentStatusPipeType.TEXT): any {
    switch (segmentStatus) {
      case SEGMENT_STATUS.USED:
        return type === SegmentStatusPipeType.TEXT ? 'Used' : '#829CF8';
      case SEGMENT_STATUS.UNUSED:
        return type === SegmentStatusPipeType.TEXT ? 'Unused' : '#D8D8D8';
      case SEGMENT_STATUS.LOCKED:
        return type === SegmentStatusPipeType.TEXT ? 'Used (Locked)' : '#0CDDA5';
      case SEGMENT_STATUS.UNLOCKED:
        return type === SegmentStatusPipeType.TEXT ? 'Unlocked' : '#829CF8';
      case SEGMENT_STATUS.GLOBAL:
        return type === SegmentStatusPipeType.TEXT ? 'Global' : '#FD9099';
    }
  }
}
