import { experimentUsersReducer, initialState } from './experiment-users.reducer';
import * as experimentUsersActions from './experiment-users.actions';

describe('experimentUsersReducer', () => {
  describe('actions to kick off requests w/ isLoading ', () => {
    const testActions = {
      actionFetchExcludedUsers: experimentUsersActions.actionFetchExcludedUsers,
      actionFetchExcludedGroups: experimentUsersActions.actionFetchExcludedGroups,
      actionExcludeUser: experimentUsersActions.actionExcludeUser,
      actionExcludeGroup: experimentUsersActions.actionExcludeGroup,
      actionDeleteExcludedUser: experimentUsersActions.actionDeleteExcludedUser,
      actionDeleteExcludedGroup: experimentUsersActions.actionDeleteExcludedGroup,
    };

    for (const actionKey in testActions) {
      const previousState = { ...initialState };
      previousState.isLoading = false;

      const newState = experimentUsersReducer(previousState, testActions[actionKey]);

      it(`on ${actionKey} reducer should return a state with isLoading: true`, () => {
        expect(newState.isLoading).toEqual(true);
      });
    }
  });

  describe('actions to fetch excluded entities', () => {
    it('on actionFetchExcludedUsers reducer should return the excludedUsers with isLoading: false', () => {
      const mockData = [
        {
          createdAt: 'testDate',
          updatedAt: 'testDate',
          versionNumber: 0,
          userId: 'abc123',
        },
      ];
      const mockId = 'userabc123';

      const previousState = { ...initialState };
      previousState.entities = {};
      previousState.isLoading = true;

      const action = experimentUsersActions.actionFetchExcludedUsersSuccess({
        data: mockData,
      });

      const newState = experimentUsersReducer(previousState, action);

      expect(newState.isLoading).toEqual(false);
      expect(newState.entities[mockId]).toEqual(mockData[0]);
    });

    it('on actionFetchExcludedGroupsSuccess reducer should return the excludedUsers with isLoading: false', () => {
      const mockData = [
        {
          createdAt: 'testDate',
          updatedAt: 'testDate',
          versionNumber: 0,
          groupId: 'xyz987',
          type: 'school',
        },
      ];
      const mockId = 'schoolxyz987';

      const previousState = { ...initialState };
      previousState.entities = {};
      previousState.isLoading = true;

      const action = experimentUsersActions.actionFetchExcludedGroupsSuccess({
        data: mockData,
      });

      const newState = experimentUsersReducer(previousState, action);

      expect(newState.isLoading).toEqual(false);
      expect(newState.entities[mockId]).toEqual(mockData[0]);
    });

    it('on actionExcludeGroupSuccess reducer should return the excludedUsers with isLoading: false', () => {
      const mockData = [
        {
          createdAt: 'testDate',
          updatedAt: 'testDate',
          versionNumber: 0,
          userId: 'abc123',
        },
      ];
      const mockId = 'userabc123';

      const previousState = { ...initialState };
      previousState.entities = {};
      previousState.isLoading = true;

      const action = experimentUsersActions.actionExcludeGroupSuccess({
        data: mockData,
      });

      const newState = experimentUsersReducer(previousState, action);

      expect(newState.isLoading).toEqual(false);
      expect(newState.entities[mockId]).toEqual(mockData[0]);
    });

    it('on actionExcludeGroupSuccess reducer should return no excludedUsers with isLoading: false when no data', () => {
      const mockData = [];

      const previousState = { ...initialState };
      previousState.entities = {};
      previousState.isLoading = true;

      const action = experimentUsersActions.actionExcludeGroupSuccess({
        data: mockData,
      });

      const newState = experimentUsersReducer(previousState, action);

      expect(newState.isLoading).toEqual(false);
      expect(newState.entities).toStrictEqual({});
    });

    it('on actionExcludeUserSuccess reducer should return the excludedUser with isLoading: false', () => {
      const mockData = [
        {
          createdAt: 'testDate',
          updatedAt: 'testDate',
          versionNumber: 0,
          groupId: 'xyz987',
          type: 'school',
        },
      ];
      const mockId = 'schoolxyz987';

      const previousState = { ...initialState };
      previousState.entities = {};
      previousState.isLoading = true;

      const action = experimentUsersActions.actionExcludeUserSuccess({
        data: mockData,
      });

      const newState = experimentUsersReducer(previousState, action);

      expect(newState.isLoading).toEqual(false);
      expect(newState.entities[mockId]).toEqual(mockData[0]);
    });
  });

  describe('actions to resolve requests w/ isLoading false ', () => {
    const testActions = {
      actionFetchExcludedUsersFailure: experimentUsersActions.actionFetchExcludedUsersFailure,
      actionFetchExcludedGroupsFailure: experimentUsersActions.actionFetchExcludedGroupsFailure,
      actionExcludedUserFailure: experimentUsersActions.actionExcludedUserFailure,
      actionExcludedGroupFailure: experimentUsersActions.actionExcludedGroupFailure,
      actionDeleteExcludedUserFailure: experimentUsersActions.actionDeleteExcludedUserFailure,
      actionDeleteExcludedGroupFailure: experimentUsersActions.actionDeleteExcludedGroupFailure,
    };

    for (const actionKey in testActions) {
      const previousState = { ...initialState };
      previousState.isLoading = true;

      const newState = experimentUsersReducer(previousState, testActions[actionKey]);

      it(`on ${actionKey} reducer should return a state with isLoading: false`, () => {
        expect(newState.isLoading).toEqual(false);
      });
    }
  });

  describe('actions to delete excluded entities', () => {
    it('on actionDeleteExcludedUserSuccess reducer should return the excludedUsers with isLoading: false', () => {
      const mockData = [
        {
          createdAt: 'testDate',
          updatedAt: 'testDate',
          versionNumber: 0,
          userId: 'abc123',
        },
      ];
      const mockId = 'userabc123';

      const previousState = { ...initialState };
      previousState.entities[mockId] = mockData[0];
      previousState.isLoading = true;

      const action = experimentUsersActions.actionDeleteExcludedUserSuccess({
        data: mockData,
      });

      const newState = experimentUsersReducer(previousState, action);

      expect(newState.isLoading).toEqual(false);
      expect(newState.entities[mockId]).toEqual(undefined);
    });

    it('on actionDeleteExcludedGroupSuccess reducer should return the excludedUsers with isLoading: false', () => {
      const mockData = [
        {
          createdAt: 'testDate',
          updatedAt: 'testDate',
          versionNumber: 0,
          groupId: 'xyz987',
          type: 'school',
        },
      ];
      const mockId = 'schoolxyz987';

      const previousState = { ...initialState };
      previousState.entities[mockId] = mockData[0];
      previousState.isLoading = true;

      const action = experimentUsersActions.actionDeleteExcludedGroupSuccess({
        data: mockData,
      });

      const newState = experimentUsersReducer(previousState, action);

      expect(newState.isLoading).toEqual(false);
      expect(newState.entities[mockId]).toEqual(undefined);
    });

    xit('on actionExcludeGroupSuccess reducer should return the excludedUsers with isLoading: false', () => {
      const mockData = [
        {
          createdAt: 'testDate',
          updatedAt: 'testDate',
          versionNumber: 0,
          userId: 'abc123',
        },
      ];
      const mockId = 'userabc123';

      const previousState = { ...initialState };
      previousState.entities = {};
      previousState.isLoading = true;

      const action = experimentUsersActions.actionExcludeGroupSuccess({
        data: mockData,
      });

      const newState = experimentUsersReducer(previousState, action);

      expect(newState.isLoading).toEqual(false);
      expect(newState.entities[mockId]).toEqual(mockData[0]);
    });

    xit('on actionExcludeGroupSuccess reducer should return no excludedUsers with isLoading: false when no data', () => {
      const mockData = [];

      const previousState = { ...initialState };
      previousState.entities = {};
      previousState.isLoading = true;

      const action = experimentUsersActions.actionExcludeGroupSuccess({
        data: mockData,
      });

      const newState = experimentUsersReducer(previousState, action);

      expect(newState.isLoading).toEqual(false);
      expect(newState.entities).toStrictEqual({});
    });

    xit('on actionExcludeUserSuccess reducer should return the excludedUser with isLoading: false', () => {
      const mockData = [
        {
          createdAt: 'testDate',
          updatedAt: 'testDate',
          versionNumber: 0,
          groupId: 'xyz987',
          type: 'school',
        },
      ];
      const mockId = 'schoolxyz987';

      const previousState = { ...initialState };
      previousState.entities = {};
      previousState.isLoading = true;

      const action = experimentUsersActions.actionExcludeUserSuccess({
        data: mockData,
      });

      const newState = experimentUsersReducer(previousState, action);

      expect(newState.isLoading).toEqual(false);
      expect(newState.entities[mockId]).toEqual(mockData[0]);
    });
  });
});
