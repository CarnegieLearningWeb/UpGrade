import { HttpClient } from "@angular/common/http";
import { of } from "rxjs/internal/observable/of";
import { environment } from "../../../environments/environment";
import { ExperimentUsersDataService } from "./experiment-users.data.service";

class MockHTTPClient {
    get = jest.fn().mockReturnValue(of());
    post = jest.fn().mockReturnValue(of());
    delete = jest.fn().mockReturnValue(of());
    put = jest.fn().mockReturnValue(of());
}

describe('ExperimentUsersDataService', () => {
    let mockHttpClient: any; 
    let service: ExperimentUsersDataService;

    beforeEach(() => {
        mockHttpClient = new MockHTTPClient();
        service = new ExperimentUsersDataService(mockHttpClient as HttpClient);
    });

    describe('#fetchExcludedUsers', () => {
        it('should get the fetchExcludedUsers http observable', () => {
            const expectedUrl = environment.api.excludeUsers;

            service.fetchExcludedUsers();

            expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl);
        })
    })

    describe('#fetchExcludedGroups', () => {
        it('should get the fetchExcludedGroups http observable', () => {
            const expectedUrl = environment.api.excludeGroups;

            service.fetchExcludedGroups();

            expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl);
        })
    })

    describe('#excludeUser', () => {
        it('should get the excludeUser http observable', () => {
            const expectedUrl = environment.api.excludeUsers;
            const mockId = 'testId';

            service.excludeUser(mockId);

            expect(mockHttpClient.put).toHaveBeenCalledWith(expectedUrl, { id: mockId });
        })
    })

    describe('#excludeGroup', () => {
        it('should get the excludeGroup http observable', () => {
            const expectedUrl = environment.api.excludeGroups;
            const mockId = 'testId';
            const mockType = 'testType';

            service.excludeGroup(mockId, mockType);

            expect(mockHttpClient.put).toHaveBeenCalledWith(expectedUrl, { id: mockId, type: mockType });
        })
    })

    describe('#deleteExcludedUser', () => {
        it('should get the deleteExcludedUser http observable', () => {
            const mockId = 'testId';
            const expectedUrl = `${environment.api.excludeUsers}/${mockId}`;

            service.deleteExcludedUser(mockId);

            expect(mockHttpClient.delete).toHaveBeenCalledWith(expectedUrl);
        })
    })

    describe('#deleteExcludedGroup', () => {
        it('should get the deleteExcludedGroup http observable', () => {
            const mockId = 'testId';
            const mockType = 'testType';
            const expectedUrl = `${environment.api.excludeGroups}/${mockType}/${mockId}`

            service.deleteExcludedGroup(mockId, mockType);

            expect(mockHttpClient.delete).toHaveBeenCalledWith(expectedUrl);
        })
    })

})