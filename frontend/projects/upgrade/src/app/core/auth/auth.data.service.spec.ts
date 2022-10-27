import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { AuthDataService } from './auth.data.service';
import { environment } from '../../../environments/environment';
import { Environment } from '../../../environments/environment-types';

class MockHTTPClient {
    get = jest.fn().mockReturnValue(of());
    post = jest.fn().mockReturnValue(of());
    delete = jest.fn().mockReturnValue(of());
}

describe('AnalysisDataService', () => {
    let mockHttpClient: any; 
    let service: AuthDataService;
    let mockEnvironment: Environment;

    beforeEach(() => {
        mockHttpClient = new MockHTTPClient();
        mockEnvironment = { ...environment };
        service = new AuthDataService(mockHttpClient as HttpClient, mockEnvironment);
    });

    describe('#login', () => {
        it('should get the login http observable', () => {
            const expectedUrl = mockEnvironment.api.loginUser;
            const mockUserInfo = {
                id: 'test'
            }

            service.login(mockUserInfo);

            expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, mockUserInfo);
        })
    })

    describe('#getUserByEmail', () => {
        it('should get the getUserByEmail http observable', () => {
            const mockEmail = 'test@mailmail.com'
            const expectedUrl = `${mockEnvironment.api.users}/${mockEmail}`

            service.getUserByEmail(mockEmail);

            expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl);
        })
    })
})