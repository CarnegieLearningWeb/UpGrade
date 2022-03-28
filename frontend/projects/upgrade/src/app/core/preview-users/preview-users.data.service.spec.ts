import { HttpClient } from "@angular/common/http";
import { of } from "rxjs/internal/observable/of";
import { environment } from "../../../environments/environment";
import { PreviewUsersDataService } from "./preview-users.data.service";
import { PreviewUserAssignCondition } from "./store/preview-users.model";


class MockHTTPClient {
    get = jest.fn().mockReturnValue(of());
    post = jest.fn().mockReturnValue(of());
    delete = jest.fn().mockReturnValue(of());
    put = jest.fn().mockReturnValue(of());
}

describe('PreviewUsersDataService', () => {
    let mockHttpClient: any; 
    let service: PreviewUsersDataService;
    let mockParams: any;
    let mockId: string;
    let mockData: PreviewUserAssignCondition;

    beforeEach(() => {
        mockHttpClient = new MockHTTPClient();
        service = new PreviewUsersDataService(mockHttpClient as HttpClient);
        mockParams = {
            skip: 0,
            take: 10
        };
        mockId = 'abc123';
        mockData = {
            id: 'abc123',
            assignments: []
        }
    });

    describe('#fetchPreviewUsers', () => {
        it('should get the fetchPreviewUsers http observable', () => {
            const expectedUrl = environment.api.getAllPreviewUsers;
            const params = { ...mockParams };

            service.fetchPreviewUsers(params);

            expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, params);
        })
    })

    describe('#addPreviewUser', () => {
        it('should get the addPreviewUser http observable', () => {
            const expectedUrl = environment.api.previewUsers;
            const id = mockId;

            service.addPreviewUser(id);

            expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, { id });
        })
    })

    describe('#deletePreviewUser', () => {
        it('should get the deletePreviewUser http observable', () => {
            const id = mockId;
            const expectedUrl = `${environment.api.previewUsers}/${id}`;

            service.deletePreviewUser(id);

            expect(mockHttpClient.delete).toHaveBeenCalledWith(expectedUrl);
        })
    })

    describe('#assignConditionToPreviewUser', () => {
        it('should get the assignConditionToPreviewUser http observable', () => {
            const data = mockData;
            const expectedUrl = environment.api.previewUsersAssignCondition;

            service.assignConditionToPreviewUser(data);

            expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, data);
        })
    })
})