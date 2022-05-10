import { HttpClient } from "@angular/common/http";
import { of } from "rxjs/internal/observable/of";
import { environment } from "../../../environments/environment";
import { UserRole } from "./store/users.model";
import { UsersDataService } from "./users.data.service";


class MockHTTPClient {
    get = jest.fn().mockReturnValue(of());
    post = jest.fn().mockReturnValue(of());
    delete = jest.fn().mockReturnValue(of());
    put = jest.fn().mockReturnValue(of());
}

describe('SettingsDataService', () => {
    let mockHttpClient: any; 
    let service: UsersDataService;
    let mockParams: any;
    let mockEmail: string;
    let mockRole: UserRole;

    beforeEach(() => {
        mockHttpClient = new MockHTTPClient();
        service = new UsersDataService(mockHttpClient as HttpClient);
        mockParams = {};
        mockEmail = "test@testmail.com";
        mockRole = UserRole.ADMIN;
    });

    describe('#fetchUsers', () => {
        it('should get the fetchUsers http observable', () => {
            const expectedUrl = environment.api.getAllUsers;
            const params = { ...mockParams };

            service.fetchUsers(params);

            expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, params);
        })
    })

    describe('#updateUserDetails', () => {
        it('should get the updateUserDetails http observable', () => {
            const expectedUrl = environment.api.userDetails;
            const { firstName, lastName, email } = mockParams;
            const role = mockRole;

            service.updateUserDetails(firstName, lastName, email, role);

            expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, { email, role});
        })
    })

    describe('#createNewUser', () => {
        it('should get the createNewUser http observable', () => {
            const expectedUrl = environment.api.users;
            const { firstName, lastName, email } = mockParams;
            const role = mockRole;

            service.createNewUser(firstName, lastName, email, role);

            expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, { email, role});
        })
    })

    describe('#deleteUser', () => {
        it('should get the deleteUser http observable', () => {
            const email = mockParams;
            const expectedUrl = `${environment.api.users}/${email}`;

            service.deleteUser(email);

            expect(mockHttpClient.delete).toHaveBeenCalledWith(expectedUrl);
        })
    })
})