import { Interfaces } from '../identifiers';
import { IMetricUnit } from 'upgrade_types';
export default function addMetrics(url: string, token: string, metrics: IMetricUnit[]): Promise<Interfaces.IMetric[]>;
