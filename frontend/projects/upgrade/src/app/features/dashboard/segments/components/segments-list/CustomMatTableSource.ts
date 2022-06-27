import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SEGMENT_TYPE } from '../../../../../../../../../../types/src';
import { Segment } from '../../../../../core/segments/store/segments.model';

class CustomMatTableSource extends MatTableDataSource<Segment> {
  sortData = (data: Segment[], sort: MatSort): Segment[] => {
    const globalIndex = data.findIndex((d: Segment) => d.type === SEGMENT_TYPE.GLOBAL_EXCLUDE);
    const globalData = data.splice(globalIndex, 1);
    let sortedData = data.sort();
    if (sort.direction === 'desc') {
      sortedData.reverse();
    }
    return [...globalData, ...sortedData];
  };
}

export { CustomMatTableSource };
