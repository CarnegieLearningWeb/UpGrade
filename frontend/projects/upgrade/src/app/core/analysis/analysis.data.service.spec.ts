import { HttpClient } from "@angular/common/http";
import { of } from "rxjs";
import { environment } from "../../../environments/environment";
import { AnalysisDataService } from "./analysis.data.service";
import { UpsertMetrics } from "./store/analysis.models";

class MockHTTPClient {
    get = jest.fn().mockReturnValue(of());
    post = jest.fn().mockReturnValue(of());
    delete = jest.fn().mockReturnValue(of());
}

describe('AnalysisDataService', () => {
    let mockHttpClient: any; 
    let service: AnalysisDataService;

    beforeEach(() => {
        mockHttpClient = new MockHTTPClient();
        service = new AnalysisDataService(mockHttpClient as HttpClient);
    })

    describe('#fetchMetrics', () => {
        it('should get the fetchMetrics http observable', () => {
            const expectedUrl = environment.api.metrics;

            service.fetchMetrics();

            expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl);
        })
    })

    describe('#upsertMetrics', () => {
        it('should get the upsertMetrics http observable', () => {
            const expectedUrl = environment.api.metricsSave;
            const mockMetrics: UpsertMetrics = {
                metricUnit: [
                    {
                        key: 'test',
                        children: []
                    }
                ]
            }
            
            service.upsertMetrics(mockMetrics);

            expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, mockMetrics);
        })
    })

    describe('#deleteMetric', () => {
        it('should get the deleteMetric http observable', () => {
            const expectedKey = 'test';
            const expectedUrl = `${environment.api.metrics}/${expectedKey}`
            
            service.deleteMetric(expectedKey);

            expect(mockHttpClient.delete).toHaveBeenCalledWith(expectedUrl);
        })
    })

    describe('#executeQuery', () => {
        it('should get the executeQuery http observable', () => {
            const expectedQueryIds = [ 'test', 'values' ];
            const expectedUrl = environment.api.queryResult;
            
            service.executeQuery(expectedQueryIds);

            expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, { queryIds: expectedQueryIds });
        })
    })
})