import { NextFunction } from 'express';
import { UserCheckMiddleware } from '../../../src/api/middlewares/UserCheckMiddleware';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { RequestedExperimentUser } from '../../../src/api/controllers/validators/ExperimentUserValidator';
import { AppRequest } from '../../../src/types';
import { SERVER_ERROR } from 'upgrade_types';

// Mock services
class SettingServiceMock {
  // Placeholder for settings service mock
  public getSetting(): any {
    return {};
  }
}

class ExperimentUserServiceMock {
  private readonly mockUsers: Map<string, RequestedExperimentUser> = new Map();

  public setMockUser(userId: string, user: RequestedExperimentUser): void {
    this.mockUsers.set(userId, user);
  }

  public clearMockUsers(): void {
    this.mockUsers.clear();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getUserDoc(userId: string, _logger: UpgradeLogger): Promise<RequestedExperimentUser | null> {
    return this.mockUsers.get(userId) || null;
  }
}

describe('UserCheckMiddleware Tests', () => {
  let middleware: UserCheckMiddleware;
  let mockSettingService: SettingServiceMock;
  let mockExperimentUserService: ExperimentUserServiceMock;
  let mockRequest: Partial<AppRequest>;
  let mockResponse: any;
  let nextFunction: NextFunction;
  let mockLogger: UpgradeLogger;

  beforeEach(() => {
    mockSettingService = new SettingServiceMock();
    mockExperimentUserService = new ExperimentUserServiceMock();
    middleware = new UserCheckMiddleware(mockSettingService as any, mockExperimentUserService as any);

    mockLogger = new UpgradeLogger();
    jest.spyOn(mockLogger, 'child').mockReturnValue(mockLogger as any);
    jest.spyOn(mockLogger, 'debug').mockImplementation();
    jest.spyOn(mockLogger, 'info').mockImplementation();
    jest.spyOn(mockLogger, 'error').mockImplementation();

    mockRequest = {
      get: jest.fn(),
      logger: mockLogger,
      url: '/api/v6/test',
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    nextFunction = jest.fn();

    // Clear mock users before each test
    mockExperimentUserService.clearMockUsers();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic middleware functionality', () => {
    test('should call next() when User-Id header is present and user exists', async () => {
      const userId = 'test-user-123';
      const mockUser = new RequestedExperimentUser();
      mockUser.id = userId;
      mockUser.requestedUserId = userId;
      mockUser.group = { classId: ['class1'] };

      (mockRequest.get as jest.Mock).mockReturnValue(userId);
      mockExperimentUserService.setMockUser(userId, mockUser);

      await middleware.use(mockRequest as AppRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
      expect(mockRequest.userDoc).toEqual(mockUser);
      expect(mockLogger.child).toHaveBeenCalledWith({ user_id: userId });
    });

    test('should return error when User-Id header is missing', async () => {
      (mockRequest.get as jest.Mock).mockReturnValue(undefined);

      await middleware.use(mockRequest as AppRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User-Id header not found.',
          type: SERVER_ERROR.MISSING_HEADER_USER_ID,
          httpCode: 400,
        })
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });

    test('should return error when user not found for non-init endpoints', async () => {
      const userId = 'non-existent-user';
      (mockRequest.get as jest.Mock).mockReturnValue(userId);
      mockRequest.url = '/api/v6/assign'; // Non-init endpoint

      await middleware.use(mockRequest as AppRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: `User not found: ${userId}`,
          type: SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED,
          httpCode: 404,
        })
      );
    });

    test('should allow non-existent user for init endpoint', async () => {
      const userId = 'new-user-123';
      (mockRequest.get as jest.Mock).mockReturnValue(userId);
      mockRequest.url = '/api/v6/init';

      await middleware.use(mockRequest as AppRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
      expect(mockRequest.userDoc).toBeNull();
    });

    test('should handle exceptions and call next with error', async () => {
      const userId = 'test-user';
      const error = new Error('Database connection failed');

      (mockRequest.get as jest.Mock).mockReturnValue(userId);
      jest.spyOn(mockExperimentUserService, 'getUserDoc').mockRejectedValue(error);

      await middleware.use(mockRequest as AppRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(error);
      expect(mockLogger.error).toHaveBeenCalledWith(error);
    });
  });

  describe('Feature flag endpoint handling', () => {
    beforeEach(() => {
      mockRequest.url = '/api/v6/featureflag';
    });

    test('should handle session-only groups (ephemeral user mode)', async () => {
      const userId = 'ephemeral-user';
      const sessionGroups = { classId: ['session-class'], schoolId: ['session-school'] };

      (mockRequest.get as jest.Mock).mockReturnValue(userId);
      mockRequest.body = {
        groupsForSession: sessionGroups,
        includeStoredUserGroups: false,
      };

      await middleware.use(mockRequest as AppRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
      expect(mockRequest.userDoc.id).toBe(userId);
      expect(mockRequest.userDoc.requestedUserId).toBe(userId);
      expect(mockRequest.userDoc.group).toEqual(sessionGroups);
      expect(mockRequest.userDoc.workingGroup).toBeUndefined();
      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: 'Created ephemeral user with session groups',
        experimentUserDoc: expect.any(Object),
      });
    });

    test('should merge session groups with stored user groups', async () => {
      const userId = 'existing-user';
      const storedUser = new RequestedExperimentUser();
      storedUser.id = userId;
      storedUser.requestedUserId = userId;
      storedUser.group = { classId: ['stored-class'], instructorId: ['stored-instructor'] };

      const sessionGroups = { classId: ['session-class'], schoolId: ['session-school'] };

      (mockRequest.get as jest.Mock).mockReturnValue(userId);
      mockRequest.body = {
        groupsForSession: sessionGroups,
        includeStoredUserGroups: true,
      };

      mockExperimentUserService.setMockUser(userId, storedUser);

      await middleware.use(mockRequest as AppRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
      expect(mockRequest.userDoc.group).toEqual({
        classId: ['stored-class', 'session-class'], // Merged and deduplicated
        instructorId: ['stored-instructor'],
        schoolId: ['session-school'],
      });
      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: 'Merged session groups with stored user groups',
        experimentUserDoc: expect.any(Object),
      });
    });

    test('should use session groups when stored user has no groups', async () => {
      const userId = 'user-no-groups';
      const storedUser = new RequestedExperimentUser();
      storedUser.id = userId;
      storedUser.requestedUserId = userId;
      storedUser.group = undefined; // No stored groups

      const sessionGroups = { classId: ['session-class'] };

      (mockRequest.get as jest.Mock).mockReturnValue(userId);
      mockRequest.body = {
        groupsForSession: sessionGroups,
        includeStoredUserGroups: true,
      };

      mockExperimentUserService.setMockUser(userId, storedUser);

      await middleware.use(mockRequest as AppRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
      expect(mockRequest.userDoc.group).toEqual(sessionGroups);
      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: 'Merged session groups with stored user groups',
        experimentUserDoc: expect.any(Object),
      });
    });

    test('should use standard user lookup without session modifications', async () => {
      const userId = 'standard-user';
      const storedUser = new RequestedExperimentUser();
      storedUser.id = userId;
      storedUser.requestedUserId = userId;
      storedUser.group = { classId: ['stored-class'] };

      (mockRequest.get as jest.Mock).mockReturnValue(userId);
      mockRequest.body = {}; // No session groups provided

      mockExperimentUserService.setMockUser(userId, storedUser);

      await middleware.use(mockRequest as AppRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
      expect(mockRequest.userDoc).toEqual(storedUser);
      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: 'Using standard user lookup without session group modifications',
        experimentUserDoc: storedUser,
      });
    });

    test('should return error when user not found with includeStoredUserGroups=true', async () => {
      const userId = 'non-existent-user';
      mockRequest.url = '/api/v6/featureflag';
      (mockRequest.get as jest.Mock).mockReturnValue(userId);
      mockRequest.body = {
        groupsForSession: { classId: ['session-class'] },
        includeStoredUserGroups: true,
      };

      // No user set in mock service

      await middleware.use(mockRequest as AppRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: `User not found: ${userId}`,
          type: SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED,
          httpCode: 404,
        })
      );
    });
  });

  describe('Group merging functionality', () => {
    test('should merge groups with unique values', () => {
      const existing = {
        classId: ['class1', 'class2'],
        instructorId: ['instructor1'],
      };
      const incoming = {
        classId: ['class2', 'class3'], // class2 is duplicate
        schoolId: ['school1'],
      };

      // Access private method via reflection for testing
      const result = (middleware as any).mergeGroupsWithUniqueValues(existing, incoming);

      expect(result).toEqual({
        classId: ['class1', 'class2', 'class3'],
        instructorId: ['instructor1'],
        schoolId: ['school1'],
      });
    });

    test('should handle undefined existing groups', () => {
      const incoming = {
        classId: ['class1'],
        schoolId: ['school1'],
      };

      const result = (middleware as any).mergeGroupsWithUniqueValues(undefined, incoming);

      expect(result).toEqual(incoming);
    });

    test('should handle empty incoming groups', () => {
      const existing = {
        classId: ['class1'],
      };

      const result = (middleware as any).mergeGroupsWithUniqueValues(existing, {});

      expect(result).toEqual(existing);
    });
  });

  describe('Session user creation', () => {
    test('should create session user with provided groups', () => {
      const sessionGroups = {
        classId: ['class1', 'class2'],
        schoolId: ['school1'],
      };

      const result = (middleware as any).createSessionUser('session-user', sessionGroups);

      expect(result).toMatchObject({
        id: 'session-user',
        requestedUserId: 'session-user',
        group: sessionGroups,
        workingGroup: undefined,
      });
      expect(result).toBeInstanceOf(RequestedExperimentUser);
    });
  });

  describe('Edge cases and error scenarios', () => {
    test('should handle null User-Id header', async () => {
      (mockRequest.get as jest.Mock).mockReturnValue(null);

      await middleware.use(mockRequest as AppRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User-Id header not found.',
          type: SERVER_ERROR.MISSING_HEADER_USER_ID,
        })
      );
    });

    test('should handle empty string User-Id header', async () => {
      (mockRequest.get as jest.Mock).mockReturnValue('');

      await middleware.use(mockRequest as AppRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User-Id header not found.',
          type: SERVER_ERROR.MISSING_HEADER_USER_ID,
        })
      );
    });

    test('should handle feature flag endpoint with includeStoredUserGroups=false but no groupsForSession', async () => {
      const userId = 'test-user';
      mockRequest.url = '/api/v6/featureflag';
      (mockRequest.get as jest.Mock).mockReturnValue(userId);
      mockRequest.body = {
        includeStoredUserGroups: false,
        // No groupsForSession provided - this should fallback to standard lookup
      };

      const storedUser = new RequestedExperimentUser();
      storedUser.id = userId;
      storedUser.requestedUserId = userId;
      mockExperimentUserService.setMockUser(userId, storedUser);

      await middleware.use(mockRequest as AppRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
      expect(mockRequest.userDoc).toEqual(storedUser);
      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: 'Using standard user lookup without session group modifications',
        experimentUserDoc: storedUser,
      });
    });

    test('should handle complex group merging with multiple overlapping keys', async () => {
      const userId = 'complex-user';
      mockRequest.url = '/api/v6/featureflag';

      const storedUser = new RequestedExperimentUser();
      storedUser.id = userId;
      storedUser.requestedUserId = userId;
      storedUser.group = {
        classId: ['stored1', 'stored2'],
        schoolId: ['school-stored'],
        instructorId: ['instructor-stored'],
      };

      const sessionGroups = {
        classId: ['stored1', 'session1'], // overlap with stored1
        schoolId: ['school-session'], // different from stored
        newGroupType: ['new-value'],
      };

      (mockRequest.get as jest.Mock).mockReturnValue(userId);
      mockRequest.body = {
        groupsForSession: sessionGroups,
        includeStoredUserGroups: true,
      };

      mockExperimentUserService.setMockUser(userId, storedUser);

      await middleware.use(mockRequest as AppRequest, mockResponse, nextFunction);

      expect(mockRequest.userDoc.group).toEqual({
        classId: ['stored1', 'stored2', 'session1'],
        schoolId: ['school-stored', 'school-session'],
        instructorId: ['instructor-stored'],
        newGroupType: ['new-value'],
      });
    });
  });

  describe('URL pattern matching', () => {
    test('should handle different feature flag URL patterns', async () => {
      const userId = 'test-user';
      const sessionGroups = { classId: ['test'] };

      (mockRequest.get as jest.Mock).mockReturnValue(userId);
      mockRequest.body = {
        groupsForSession: sessionGroups,
        includeStoredUserGroups: false,
      };

      // Test various URL patterns that should trigger feature flag handling
      const featureFlagUrls = ['/api/v6/featureflag', '/some/path/v6/featureflag', '/v6/featureflag'];

      for (const url of featureFlagUrls) {
        mockRequest.url = url;
        jest.clearAllMocks();

        await middleware.use(mockRequest as AppRequest, mockResponse, nextFunction);

        expect(nextFunction).toHaveBeenCalledWith();
        expect(mockRequest.userDoc.group).toEqual(sessionGroups);
      }
    });

    test('should use standard flow for non-feature flag URLs', async () => {
      const userId = 'test-user';
      const storedUser = new RequestedExperimentUser();
      storedUser.id = userId;
      storedUser.requestedUserId = userId;

      (mockRequest.get as jest.Mock).mockReturnValue(userId);
      mockRequest.body = {
        groupsForSession: { classId: ['should-be-ignored'] },
        includeStoredUserGroups: false,
      };

      mockExperimentUserService.setMockUser(userId, storedUser);

      const standardUrls = [
        '/api/v6/assign',
        '/api/v6/mark',
        '/api/v6/init',
        '/api/v5/featureflag', // Different version
      ];

      for (const url of standardUrls) {
        mockRequest.url = url;
        jest.clearAllMocks();

        await middleware.use(mockRequest as AppRequest, mockResponse, nextFunction);

        expect(nextFunction).toHaveBeenCalledWith();
        expect(mockRequest.userDoc).toEqual(storedUser);
      }
    });
  });
});
