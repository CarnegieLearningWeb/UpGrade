import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { UserRole } from './store/users.model';
import { UsersDataService } from './users.data.service';
import { API_ENDPOINTS } from '../api-endpoints.constants';

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
  let mockRole: UserRole;

  beforeEach(() => {
    mockHttpClient = new MockHTTPClient();
    service = new UsersDataService(mockHttpClient as HttpClient);
    mockParams = {};
    mockRole = UserRole.ADMIN;
  });

  describe('#fetchUsers', () => {
    it('should get the fetchUsers http observable', () => {
      const expectedUrl = API_ENDPOINTS.getAllUsers;
      const params = { ...mockParams };

      service.fetchUsers(params);

      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, params);
    });
  });

  describe('#updateUserDetails', () => {
    it('should get the updateUserDetails http observable', () => {
      const expectedUrl = API_ENDPOINTS.userDetails;
      const { firstName, lastName, email } = mockParams;
      const role = mockRole;

      service.updateUserDetails(firstName, lastName, email, role);

      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, { email, role });
    });
  });

  describe('#createNewUser', () => {
    it('should get the createNewUser http observable', () => {
      const expectedUrl = API_ENDPOINTS.users;
      const { firstName, lastName, email } = mockParams;
      const role = mockRole;

      service.createNewUser(firstName, lastName, email, role);

      expect(mockHttpClient.post).toHaveBeenCalledWith(expectedUrl, { email, role });
    });
  });

  describe('#deleteUser', () => {
    it('should get the deleteUser http observable', () => {
      const email = mockParams;
      const expectedUrl = `${API_ENDPOINTS.users}/${email}`;

      service.deleteUser(email);

      expect(mockHttpClient.delete).toHaveBeenCalledWith(expectedUrl);
    });
  });
});
