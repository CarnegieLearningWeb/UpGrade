import { Interfaces } from '../identifiers';
export default function failedExperimentPoint(url: string, token: string, experimentPoint: string, reason: string, experimentId?: string): Promise<Interfaces.IFailedExperimentPoint>;
