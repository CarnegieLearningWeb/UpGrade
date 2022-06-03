import { HttpClient } from "@angular/common/http";
import { of } from "rxjs";
import { AuthDataService } from "./auth.data.service";
import { environment } from "../../../environments/environment";

class MockHTTPClient {
    get = jest.fn().mockReturnValue(of());
    post = jest.fn().mockReturnValue(of());
    delete = jest.fn().mockReturnValue(of());
}

describe('AnalysisDataService', () => {
    let mockHttpClient: any; 
    let service: AuthDataService;

    beforeEach(() => {
        mockHttpClient = new MockHTTPClient();
        service = new AuthDataService(mockHttpClient as HttpClient);
    });

    describe('#login', () => {
        it('should get the login http observable', () => {
            const expectedUrl = environment.api.loginUser;
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
            const expectedUrl = `${environment.api.users}/${mockEmail}`

            service.getUserByEmail(mockEmail);

            expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl);
        })
    })
})