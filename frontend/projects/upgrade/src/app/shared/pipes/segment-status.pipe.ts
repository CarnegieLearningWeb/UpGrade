import { Pipe, PipeTransform } from '@angular/core';
import { SEGMENT_STATUS } from '../../core/segments/store/segments.model';

export enum SegmentStatusPipeType {
  TEXT = 'text',
  COLOR = 'color'
}

@Pipe({
  name: 'segmentStatus'
})
export class SegmentStatusPipe implements PipeTransform {
  transform(segmentStatus: SEGMENT_STATUS, type: SegmentStatusPipeType = SegmentStatusPipeType.TEXT): any {
    switch (segmentStatus) {
      // TODO add more cases
      // TODO test case
      case SEGMENT_STATUS.USED:
        return type === SegmentStatusPipeType.TEXT ? 'Used' : '#000';
      case SEGMENT_STATUS.UNUSED:
        return type === SegmentStatusPipeType.TEXT ? 'Unused' : '#d8d8d8';
      case SEGMENT_STATUS.LOCKED:
        return type === SegmentStatusPipeType.TEXT ? 'Used (Locked)' : '#0cdda5';
      case SEGMENT_STATUS.UNLOCKED:
        return type === SegmentStatusPipeType.TEXT ? 'Unlocked' : '#ff0000';
      case SEGMENT_STATUS.GLOBAL:
        return type === SegmentStatusPipeType.TEXT ? 'Global' : '#ff0000';
    }
  }
}
