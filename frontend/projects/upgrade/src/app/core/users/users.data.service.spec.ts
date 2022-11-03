import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Environment } from '../../../environments/environment-types';
import { UserRole } from './store/users.model';
import { UsersDataService } from './users.data.service';

class MockHTTPClient {
  get = jest.fn().mockReturnValue(of());
  post = jest.fn().mockReturnValue(of());
  delete = jest.fn().mockReturnValue(of());
  put = jest.fn().mockReturnValue(of());
}

describe('SettingsDataService', () => {
  let mockHttpClient: any;
  let mockEnvironment: Environment;
  let service: UsersDataService;
  let mockParams: any;
  let mockRole: UserRole;

  beforeEach(() => {
    mockHttpClient = new MockHTTPClient();
    mockEnvironment = { ...environment };
    service = new UsersDataService(mockHttpClient as HttpClient, mockEnvironment);
    mockParams = {};
    mockRole = UserRole.ADMIN;
  });

  describe('#fetchUsers', () => {
    it('should get the fetchUsers http observable', () => {
      const expectedUrl = mockEnvironment.api.getAllUsers;
      const params = { ...mockParams };

      service.fetchUsers(params);

      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, params);
    });
  });

  describe('#updateUserDetails', () => {
    it('should get the updateUserDetails http observable', () => {
      const expectedUrl = mockEnvironment.api.userDetails;
      const { firstName, lastName, email } = mockParams;
      const role = mockRole;

      service.updateUserDetails(firstName, lastName, email, role);

      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, { email, role });
    });
  });

  describe('#createNewUser', () => {
    it('should get the createNewUser http observable', () => {
      const expectedUrl = mockEnvironment.api.users;
      const { firstName, lastName, email } = mockParams;
      const role = mockRole;

      service.createNewUser(firstName, lastName, email, role);

      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, { email, role });
    });
  });

  describe('#deleteUser', () => {
    it('should get the deleteUser http observable', () => {
      const email = mockParams;
      const expectedUrl = `${mockEnvironment.api.users}/${email}`;

      service.deleteUser(email);

      expect(mockHttpClient.delete).toHaveBeenCalledWith(expectedUrl);
    });
  });
});
