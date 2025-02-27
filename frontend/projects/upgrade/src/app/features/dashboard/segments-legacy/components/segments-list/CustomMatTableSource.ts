import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SEGMENT_TYPE } from 'upgrade_types';
import { Segment_LEGACY } from '../../../../../core/segments_LEGACY/store/segments.model._LEGACY';

class CustomMatTableSource extends MatTableDataSource<Segment_LEGACY> {
  sortData = (data: Segment_LEGACY[], sort: MatSort): Segment_LEGACY[] => {
    const globalIndex = data.findIndex((d: Segment_LEGACY) => d.type === SEGMENT_TYPE.GLOBAL_EXCLUDE);
    const globalData = globalIndex !== -1 ? data.splice(globalIndex, 1) : [];

    const sortedData = data.sort((a, b) => {
      let isAsc = sort.direction === 'asc';
      let active = sort.active;

      // Default to 'lastUpdate' in descending order when sort direction is empty
      if (sort.direction === '') {
        isAsc = false;
        active = 'lastUpdate';
      }

      switch (active) {
        case 'name':
          return compare(a.name, b.name, isAsc);
        case 'status':
          return compare(a.status, b.status, isAsc);
        case 'lastUpdate':
          return compare(new Date(a.updatedAt), new Date(b.updatedAt), isAsc);
        case 'context':
          return compare(a.context, b.context, isAsc);
        case 'description':
          return compare(a.description, b.description, isAsc);
        case 'membersCount':
          return compare(getMembersCount(a), getMembersCount(b), isAsc);
        default:
          return compare(new Date(a.updatedAt), new Date(b.updatedAt), false); // Default to lastUpdate desc
      }
    });

    return [...globalData, ...sortedData];
  };
}

function getMembersCount(segment: Segment_LEGACY): number {
  return (
    (segment.groupForSegment?.length || 0) +
    (segment.individualForSegment?.length || 0) +
    (segment.subSegments?.length || 0)
  );
}

function compare(a: any, b: any, isAsc: boolean) {
  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b, undefined, { sensitivity: 'base' }) * (isAsc ? 1 : -1);
  }
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

export { CustomMatTableSource };
