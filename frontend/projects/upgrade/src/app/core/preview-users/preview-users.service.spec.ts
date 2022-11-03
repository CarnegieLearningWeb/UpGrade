import { BehaviorSubject } from 'rxjs';
import { PreviewUsersService } from './preview-users.service';
import * as PreviewUsersSelectors from './store/preview-users.selectors';
import * as PreviewUsersActions from './store/preview-users.actions';
import { fakeAsync, tick } from '@angular/core/testing';
import { PreviewUsers } from './store/preview-users.model';

const MockStateStore$ = new BehaviorSubject({});
(MockStateStore$ as any).dispatch = jest.fn();

describe('PreviewUsersService', () => {
  let mockStore: any;
  let service: PreviewUsersService;
  const mockPreviewUsersList: PreviewUsers[] = [
    {
      createdAt: '04/23/17 04:34:22 +0000',
      updatedAt: 'abc123',
      versionNumber: 5,
      id: 'user1',
    },
    {
      createdAt: '04/25/17 04:34:22 +0000',
      updatedAt: 'abc123',
      versionNumber: 5,
      id: 'user2',
    },
    {
      createdAt: '04/24/17 04:34:22 +0000',
      updatedAt: 'abc123',
      versionNumber: 5,
      id: 'user3',
    },
    {
      createdAt: '04/24/17 04:34:22 +0000',
      updatedAt: 'abc123',
      versionNumber: 5,
      id: 'user4',
    },
  ];

  beforeEach(() => {
    mockStore = MockStateStore$;
    service = new PreviewUsersService(mockStore);
  });

  describe('#allPreviewUsers$', () => {
    it('should return sorted list of the previewUsers', fakeAsync(() => {
      const expectedValue = [...mockPreviewUsersList][1];

      PreviewUsersSelectors.selectAllPreviewUsers.setResult([...mockPreviewUsersList]);

      service.allPreviewUsers$.subscribe((val) => {
        tick(0);
        expect(val[0]).toEqual(expectedValue);
      });
    }));
  });

  describe('#isAllPreviewUsersFetched', () => {
    const testCases = [
      {
        whenCondition: 'skip does not equal total',
        expectedValue: false,
        skipPreviewUsers: 0,
        totalPreviewUsers: 1,
      },
      {
        whenCondition: 'skip does equal total',
        expectedValue: true,
        skipPreviewUsers: 1,
        totalPreviewUsers: 1,
      },
    ];

    testCases.forEach((testCase) => {
      const { whenCondition, expectedValue, skipPreviewUsers, totalPreviewUsers } = testCase;

      it(`WHEN ${whenCondition}, THEN ${expectedValue}:`, fakeAsync(() => {
        PreviewUsersSelectors.selectSkipPreviewUsers.setResult(skipPreviewUsers);
        PreviewUsersSelectors.selectTotalPreviewUsers.setResult(totalPreviewUsers);

        service.isAllPreviewUsersFetched().subscribe((val) => {
          tick(0);
          expect(val).toEqual(expectedValue);
        });
      }));
    });
  });

  describe('#fetchPreviewUsers', () => {
    it('should dispatch actionFetchPreviewUsers with the given input', () => {
      const fromStarting = true;

      service.fetchPreviewUsers(fromStarting);

      expect(mockStore.dispatch).toHaveBeenCalledWith(PreviewUsersActions.actionFetchPreviewUsers({ fromStarting }));
    });

    it('should dispatch actionFetchFeatureFlags without the given input', () => {
      service.fetchPreviewUsers();

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        PreviewUsersActions.actionFetchPreviewUsers({ fromStarting: undefined })
      );
    });
  });

  describe('#addPreviewUser', () => {
    it('should dispatch actionAddPreviewUser with the given input', () => {
      const id = 'abc123';

      service.addPreviewUser(id);

      expect(mockStore.dispatch).toHaveBeenCalledWith(PreviewUsersActions.actionAddPreviewUser({ id }));
    });
  });

  describe('#deletePreviewUser', () => {
    it('should dispatch actionDeletePreviewUser with the given input', () => {
      const id = 'abc123';

      service.deletePreviewUser(id);

      expect(mockStore.dispatch).toHaveBeenCalledWith(PreviewUsersActions.actionDeletePreviewUser({ id }));
    });
  });

  describe('#assignConditionForPreviewUser', () => {
    it('should dispatch actionAssignConditionToPreviewUser with the given input', () => {
      const data = { id: 'abc123', assignments: [] };

      service.assignConditionForPreviewUser(data);

      expect(mockStore.dispatch).toHaveBeenCalledWith(PreviewUsersActions.actionAssignConditionToPreviewUser({ data }));
    });
  });
});
