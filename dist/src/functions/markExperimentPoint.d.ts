import { Interfaces } from '../identifiers';
export default function markExperimentPoint(url: string, userId: string, token: string, experimentPoint: string, condition?: any, partitionId?: string): Promise<Interfaces.IMarkExperimentPoint>;
