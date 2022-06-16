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
      case SEGMENT_STATUS.USED:
        return type === SegmentStatusPipeType.TEXT ? 'Used' : '#000';
      case SEGMENT_STATUS.UNUSED:
        return type === SegmentStatusPipeType.TEXT ? 'Unsed' : '#d8d8d8';
      case SEGMENT_STATUS.GLOBAL:
        return type === SegmentStatusPipeType.TEXT ? 'Global' : '#d8d8d8';
    }
  }
}
