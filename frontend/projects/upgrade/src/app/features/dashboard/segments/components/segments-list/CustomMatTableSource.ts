import { MatSort } from '@angular/material/sort';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import { SEGMENT_TYPE } from 'upgrade_types';
import { Segment } from '../../../../../core/segments/store/segments.model';

class CustomMatTableSource extends MatTableDataSource<Segment> {
  sortData = (data: Segment[], sort: MatSort): Segment[] => {
    const globalIndex = data.findIndex((d: Segment) => d.type === SEGMENT_TYPE.GLOBAL_EXCLUDE);
    const globalData = data.splice(globalIndex, 1);
    const sortedData = data.sort();
    if (sort.direction === 'desc') {
      sortedData.reverse();
    }
    return [...globalData, ...sortedData];
  };
}

export { CustomMatTableSource };
