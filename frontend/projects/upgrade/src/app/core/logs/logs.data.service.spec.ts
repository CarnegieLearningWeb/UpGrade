import { HttpClient } from "@angular/common/http";
import { of } from "rxjs";
import { environment } from "../../../environments/environment";
import { LogsDataService } from "./logs.data.service";
import { AuditLogParams, ErrorLogParams } from "./store/logs.model";

class MockHTTPClient {
    get = jest.fn().mockReturnValue(of());
    post = jest.fn().mockReturnValue(of());
    delete = jest.fn().mockReturnValue(of());
    put = jest.fn().mockReturnValue(of());
}

describe('LogsDataService', () => {
    let mockHttpClient: any; 
    let service: LogsDataService;
    let mockAuditLogParams: AuditLogParams;
    let mockErrorLogParams: ErrorLogParams;

    beforeEach(() => {
        mockHttpClient = new MockHTTPClient();
        service = new LogsDataService(mockHttpClient as HttpClient);
        mockAuditLogParams = {
            skip: 0,
            take: 10
        };
        mockErrorLogParams = {
            skip: 0,
            take: 10
        };
    });

    describe('#getAllAuditLogs', () => {
        it('should get the getAllAuditLogs http observable', () => {
            const expectedUrl = environment.api.getAllAuditLogs;
            const params = { ...mockAuditLogParams };

            service.getAllAuditLogs(params);

            expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, params);
        })
    })

    describe('#getAllErrorLogs', () => {
        it('should get the getAllErrorLogs http observable', () => {
            const expectedUrl = environment.api.getAllErrorLogs;
            const params = mockErrorLogParams;

            service.getAllErrorLogs(mockErrorLogParams);

            expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, params);
        })
    })
})