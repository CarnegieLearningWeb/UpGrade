import { BehaviorSubject } from 'rxjs';
import { ExperimentUsersService } from './experiment-users.service';
import {
  actionDeleteExcludedGroup,
  actionDeleteExcludedUser,
  actionExcludeGroup,
  actionExcludeUser,
  actionFetchExcludedGroups,
  actionFetchExcludedUsers,
} from './store/experiment-users.actions';

const MockStateStore$ = new BehaviorSubject({});
(MockStateStore$ as any).dispatch = jest.fn();

jest.mock('./store/experiment-users.selectors', () => ({
  selectAllEntities: jest.fn().mockReturnValue([
    { id: 'fourth', createdAt: '04/23/17 04:34:22 +0000' },
    { id: 'first', createdAt: '04/25/17 04:34:22 +0000' },
    { id: 'second', createdAt: '04/24/17 04:34:22 +0000' },
    { id: 'third', createdAt: '04/24/17 04:34:22 +0000' },
  ]),
  selectIsExcludedEntityLoading: jest.fn().mockReturnValue(true),
}));

describe('ExperimentUsersService', () => {
  const mockStore: any = MockStateStore$;
  let service: ExperimentUsersService;

  beforeEach(() => {
    service = new ExperimentUsersService(mockStore);
  });

  describe('#allExcludedEntities$', () => {
    it('should emit sorted list of entities', (done) => {
      mockStore.next('thisValueIsMeaningless');

      service.allExcludedEntities$.subscribe((val) => {
        expect(val).toEqual([
          { id: 'first', createdAt: '04/25/17 04:34:22 +0000' },
          { id: 'second', createdAt: '04/24/17 04:34:22 +0000' },
          { id: 'third', createdAt: '04/24/17 04:34:22 +0000' },
          { id: 'fourth', createdAt: '04/23/17 04:34:22 +0000' },
        ]);
        done();
      });
    });
  });

  describe('#fetchExcludedUsers', () => {
    it('should dispatch actionLoginStart', () => {
      service.fetchExcludedUsers();

      expect(mockStore.dispatch).toHaveBeenCalledWith(actionFetchExcludedUsers());
    });
  });

  describe('#fetchExcludedGroups', () => {
    it('should dispatch actionLoginStart', () => {
      service.fetchExcludedGroups();

      expect(mockStore.dispatch).toHaveBeenCalledWith(actionFetchExcludedGroups());
    });
  });

  describe('#excludeUser', () => {
    it('should dispatch actionLoginStart', () => {
      const mockId = 'testId';

      service.excludeUser(mockId);

      expect(mockStore.dispatch).toHaveBeenCalledWith(actionExcludeUser({ id: mockId }));
    });
  });

  describe('#excludeGroup', () => {
    it('should dispatch actionLoginStart', () => {
      const mockId = 'testId';
      const mockGroupType = 'testGroupType';

      service.excludeGroup(mockId, mockGroupType);

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        actionExcludeGroup({
          id: mockId,
          groupType: mockGroupType,
        })
      );
    });
  });

  describe('#deleteExcludedUser', () => {
    it('should dispatch actionLoginStart', () => {
      const mockId = 'testId';

      service.deleteExcludedUser(mockId);

      expect(mockStore.dispatch).toHaveBeenCalledWith(actionDeleteExcludedUser({ id: mockId }));
    });
  });

  describe('#deleteExcludedGroup', () => {
    it('should dispatch actionLoginStart', () => {
      const mockId = 'testId';
      const mockGroupType = 'testGroupType';

      service.deleteExcludedGroup(mockId, mockGroupType);

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        actionDeleteExcludedGroup({
          id: mockId,
          groupType: mockGroupType,
        })
      );
    });
  });
});
