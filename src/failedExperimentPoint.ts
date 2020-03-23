import { Interfaces } from './identifiers';

export default function failedExperimentPoint(experimentName: string, experimentPoint: string, reason: string): Interfaces.IResponse {
    // TODO: Update after getting endPoint detail
    return {
        status: true
    }
}