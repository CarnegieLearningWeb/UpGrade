import { BehaviorSubject } from 'rxjs';
import * as UsersSelectors from './store/users.selectors';
import * as UsersActions from './store/users.actions';
import { fakeAsync, tick } from '@angular/core/testing';
import { UsersService } from './users.service';
import { SORT_AS, User, UserRole, USER_SEARCH_SORT_KEY } from './store/users.model';

const MockStateStore$ = new BehaviorSubject({});
(MockStateStore$ as any).dispatch = jest.fn();

describe('UsersService', () => {
  let mockStore: any;
  let service: UsersService;
  const mockUsersList: User[] = [
    {
      createdAt: '04/23/17 04:34:22 +0000',
      updatedAt: '04/23/17 04:34:22 +0000',
      versionNumber: '1',
      firstName: 'test',
      lastName: 'test',
      imageUrl: 'test',
      email: 'test',
      role: UserRole.ADMIN,
    },
    {
      createdAt: '04/25/17 04:34:22 +0000',
      updatedAt: '04/25/17 04:34:22 +0000',
      versionNumber: '1',
      firstName: 'test',
      lastName: 'test',
      imageUrl: 'test',
      email: 'test',
      role: UserRole.ADMIN,
    },
    {
      createdAt: '04/24/17 04:34:22 +0000',
      updatedAt: '04/24/17 04:34:22 +0000',
      versionNumber: '1',
      firstName: 'test',
      lastName: 'test',
      imageUrl: 'test',
      email: 'test',
      role: UserRole.ADMIN,
    },
    {
      createdAt: '04/24/17 04:34:22 +0000',
      updatedAt: '04/24/17 04:34:22 +0000',
      versionNumber: '1',
      firstName: 'test',
      lastName: 'test',
      imageUrl: 'test',
      email: 'test',
      role: UserRole.ADMIN,
    },
  ];
  const mockEmail = 'test@test.com';
  const mockRole = UserRole.ADMIN;

  beforeEach(() => {
    mockStore = MockStateStore$;
    service = new UsersService(mockStore);
  });

  describe('#allUsers$', () => {
    it('should return sorted list of the previewUsers', fakeAsync(() => {
      const expectedValue = [...mockUsersList][1];

      UsersSelectors.selectAllUsers.setResult([...mockUsersList]);

      service.allUsers$.subscribe((val) => {
        tick(0);
        expect(val[0]).toEqual(expectedValue);
      });
    }));
  });

  describe('#fetchUsers', () => {
    it('should dispatch actionFetchUsers with the given input', () => {
      const fromStarting = true;

      service.fetchUsers(fromStarting);

      expect(mockStore.dispatch).toHaveBeenCalledWith(UsersActions.actionFetchUsers({ fromStarting }));
    });

    it('should dispatch actionFetchFeatureFlags without the given input', () => {
      service.fetchUsers();

      expect(mockStore.dispatch).toHaveBeenCalledWith(UsersActions.actionFetchUsers({ fromStarting: undefined }));
    });
  });

  describe('#updateUserDetails', () => {
    it('should dispatch actionUpdateUserDetails with the given input', () => {
      const firstName = mockUsersList[1].firstName;
      const lastName = mockUsersList[1].lastName;
      const email = mockEmail;
      const role = mockRole;

      service.updateUserDetails(firstName, lastName, email, role);

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        UsersActions.actionUpdateUserDetails({ userDetailsData: { firstName, lastName, email, role } })
      );
    });
  });

  describe('#createNewUser', () => {
    it('should dispatch actionCreateNewUser with the given input', () => {
      const firstName = mockUsersList[0].firstName;
      const lastName = mockUsersList[0].lastName;
      const email = mockEmail;
      const role = mockRole;

      service.createNewUser(firstName, lastName, email, role);

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        UsersActions.actionCreateNewUser({ user: { firstName, lastName, email, role } })
      );
    });
  });

  describe('#deleteUser', () => {
    it('should dispatch actionCreateNewUser with the given input', () => {
      const email = mockEmail;

      service.deleteUser(email);

      expect(mockStore.dispatch).toHaveBeenCalledWith(UsersActions.actionDeleteUser({ email }));
    });
  });

  describe('#isAllUsersFetched', () => {
    const testCases = [
      {
        whenCondition: 'skip does not equal total',
        expectedValue: false,
        skipUsers: 0,
        totalUsers: 1,
      },
      {
        whenCondition: 'skip does equal total',
        expectedValue: true,
        skipUsers: 1,
        totalUsers: 1,
      },
    ];

    testCases.forEach((testCase) => {
      const { whenCondition, expectedValue, skipUsers, totalUsers } = testCase;

      it(`WHEN ${whenCondition}, THEN ${expectedValue}:`, fakeAsync(() => {
        UsersSelectors.selectSkipUsers.setResult(skipUsers);
        UsersSelectors.selectTotalUsers.setResult(totalUsers);

        service.isAllUsersFetched().subscribe((val) => {
          tick(0);
          expect(val).toEqual(expectedValue);
        });
      }));
    });
  });

  describe('#setSearchKey', () => {
    it('should dispatch actionSetSearchKey with the given input', () => {
      const searchKey = USER_SEARCH_SORT_KEY.ALL;

      service.setSearchKey(searchKey);

      expect(mockStore.dispatch).toHaveBeenCalledWith(UsersActions.actionSetSearchKey({ searchKey }));
    });
  });

  describe('#setSearchString', () => {
    it('should dispatch actionSetSearchKey with the given input', () => {
      const searchString = 'test';

      service.setSearchString(searchString);

      expect(mockStore.dispatch).toHaveBeenCalledWith(UsersActions.actionSetSearchString({ searchString }));
    });
  });

  describe('#setSortKey', () => {
    it('should dispatch actionSetSortKey with the given input', () => {
      const sortKey = USER_SEARCH_SORT_KEY.ALL;

      service.setSortKey(sortKey);

      expect(mockStore.dispatch).toHaveBeenCalledWith(UsersActions.actionSetSortKey({ sortKey }));
    });
  });

  describe('#setSortingType', () => {
    it('should dispatch actionSetSortingType with the given input', () => {
      const sortingType = SORT_AS.ASCENDING;

      service.setSortingType(sortingType);

      expect(mockStore.dispatch).toHaveBeenCalledWith(UsersActions.actionSetSortingType({ sortingType }));
    });
  });
});
