import { Interfaces } from '../identifiers';
import fetchDataService from '../common/fetchDataService';

export default async function failedExperimentPoint(url: string, experimentPoint: string, reason: string, experimentId?: string): Promise<Interfaces.IFailedExperimentPoint> {
    try {
        let data: any = {
            experimentPoint,
            reason
        }
        if (experimentId) {
            data = {
                ...data,
                experimentId
            }
        }
        const response = await fetchDataService(url, data);
        if (response.status) {
            return {
                type: response.data.type,
                message: response.data.message
            }
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        throw new Error(error);
    }
}