import { Observable } from 'rxjs';
import { IMetricUnit } from '../../../../../../../../../../types/src';

export type LazyLoadingMetric = IMetricUnit & {
  loadChildren?: () => Observable<LazyLoadingMetric[]>;
};
