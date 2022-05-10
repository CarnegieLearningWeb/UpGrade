import { MatSort, MatTableDataSource } from '@angular/material';
import { Segment } from '../../../../../core/segments/store/segments.model';

class CustomMatTableSource extends MatTableDataSource<Segment> {
  sortData = (data: Segment[], sort: MatSort): Segment[] => {
    const globalIndex = data.findIndex((d: Segment) => d.id === '77777777-7777-7777-7777-777777777777');
    const globalData = data.splice(globalIndex, 1);
    let sortedData = data.sort();
    if (sort.direction === 'desc') {
      sortedData.reverse();
    }
    return [...globalData, ...sortedData];
  };
}

export { CustomMatTableSource };
