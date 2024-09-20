import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SEGMENT_TYPE } from 'upgrade_types';
import { Segment } from '../../../../../core/segments/store/segments.model';

class CustomMatTableSource extends MatTableDataSource<Segment> {
  sortData = (data: Segment[], sort: MatSort): Segment[] => {
    const globalIndex = data.findIndex((d: Segment) => d.type === SEGMENT_TYPE.GLOBAL_EXCLUDE);
    const globalData = globalIndex !== -1 ? data.splice(globalIndex, 1) : [];
    const sortedData = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
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
          return 0;
      }
    });
    return [...globalData, ...sortedData];
  };
}

function getMembersCount(segment: Segment): number {
  return (
    (segment.groupForSegment?.length || 0) +
    (segment.individualForSegment?.length || 0) +
    (segment.subSegments?.length || 0)
  );
}

function compare(a: any, b: any, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

export { CustomMatTableSource };
