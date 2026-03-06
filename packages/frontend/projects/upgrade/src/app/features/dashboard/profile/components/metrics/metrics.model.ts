import { Observable } from 'rxjs';
import { IMetricUnit } from '../../../../../../../../../../types/src';

export interface LazyLoadingMetric extends IMetricUnit {
  id: number;
  children: LazyLoadingMetric[];
  loadChildren?: () => Observable<LazyLoadingMetric[]>;
}
