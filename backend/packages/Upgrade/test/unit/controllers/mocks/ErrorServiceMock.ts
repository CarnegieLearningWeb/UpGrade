import { Service } from 'typedi';
import { SERVER_ERROR } from 'upgrade_types';

@Service()
export default class ErrorServiceMock {

    public getTotalLogs(filter: SERVER_ERROR): Promise<[]> {
        return Promise.resolve([]);
    }

    public getErrorLogs(limit: number, offset: number, filter: SERVER_ERROR): Promise<[]> {
        return Promise.resolve([]);
    }
}
