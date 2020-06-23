import { Interfaces } from '../identifiers';
import { ISingleMetric, IGroupMetric } from 'upgrade_types';
export default function addMetrics(url: string, token: string, metrics: Array<ISingleMetric | IGroupMetric>): Promise<Interfaces.IMetric[]>;
