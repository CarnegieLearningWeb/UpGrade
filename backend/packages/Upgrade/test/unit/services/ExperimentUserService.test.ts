import { ExperimentUserService } from '../../../src/api/services/ExperimentUserService';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { ExperimentUserRepository } from '../../../src/api/repositories/ExperimentUserRepository';
import { ExperimentRepository } from '../../../src/api/repositories/ExperimentRepository';
import { IndividualEnrollmentRepository } from '../../../src/api/repositories/IndividualEnrollmentRepository';
import { IndividualExclusionRepository } from '../../../src/api/repositories/IndividualExclusionRepository';
import { GroupExclusionRepository } from '../../../src/api/repositories/GroupExclusionRepository';
import { ExperimentUser } from '../../../src/api/models/ExperimentUser';
import { DataSource } from 'typeorm';
import { configureLogger } from '../../utils/logger';

describe('ExperimentUserService Testing', () => {
  let service: ExperimentUserService;
  let module: TestingModule;

  const mockExperimentUser = new ExperimentUser();
  mockExperimentUser.id = 'test-user-id';
  mockExperimentUser.group = {};
  mockExperimentUser.workingGroup = {};

  beforeAll(() => {
    configureLogger();
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        ExperimentUserService,
        {
          provide: getRepositoryToken(ExperimentUserRepository),
          useValue: {
            find: jest.fn(),
            findOneBy: jest.fn(),
            save: jest.fn(),
            insert: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ExperimentRepository),
          useValue: {
            find: jest.fn(),
            findOneBy: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(IndividualEnrollmentRepository),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(IndividualExclusionRepository),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(GroupExclusionRepository),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getDataSourceToken(),
          useValue: {
            getRepository: jest.fn(),
            manager: {
              transaction: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ExperimentUserService>(ExperimentUserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createGrouplessUserRecordIfNotExists', () => {
    it('should create a new user record when user does not exist', async () => {
      const userId = 'new-user-id';
      const loggerSpy = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
      } as any;

      // Mock getOriginalUserDoc to return null (user doesn't exist)
      jest.spyOn(service, 'getOriginalUserDoc').mockResolvedValue(null);

      // Mock create method to succeed
      jest.spyOn(service, 'create').mockResolvedValue({
        identifiers: [{ id: userId }],
        generatedMaps: [{ id: userId }],
        raw: [{ id: userId }],
      } as any);

      await service.createGrouplessUserRecordIfNotExists(userId, loggerSpy);

      expect(service.getOriginalUserDoc).toHaveBeenCalledWith(userId, loggerSpy);
      expect(service.create).toHaveBeenCalledWith([{ id: userId }], loggerSpy);
      expect(loggerSpy.info).toHaveBeenCalledWith({
        message: 'Created stub user record for foreign key constraint satisfaction',
        userId: userId,
      });
      expect(loggerSpy.debug).not.toHaveBeenCalled();
      expect(loggerSpy.warn).not.toHaveBeenCalled();
    });

    it('should not create a user record when user already exists', async () => {
      const userId = 'existing-user-id';
      const loggerSpy = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
      } as any;

      // Mock getOriginalUserDoc to return existing user
      jest.spyOn(service, 'getOriginalUserDoc').mockResolvedValue(mockExperimentUser);

      // Mock create method (should not be called)
      const createSpy = jest.spyOn(service, 'create').mockResolvedValue({} as any);

      await service.createGrouplessUserRecordIfNotExists(userId, loggerSpy);

      expect(service.getOriginalUserDoc).toHaveBeenCalledWith(userId, loggerSpy);
      expect(createSpy).not.toHaveBeenCalled();
      expect(loggerSpy.debug).toHaveBeenCalledWith({
        message: 'User already exists, no stub record needed',
        userId: userId,
      });
      expect(loggerSpy.info).not.toHaveBeenCalled();
      expect(loggerSpy.warn).not.toHaveBeenCalled();
    });

    it('should handle errors during user lookup and log warning', async () => {
      const userId = 'error-user-id';
      const error = new Error('Database connection failed');
      const loggerSpy = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
      } as any;

      // Mock getOriginalUserDoc to throw an error
      jest.spyOn(service, 'getOriginalUserDoc').mockRejectedValue(error);

      // Mock create method (should not be called due to error)
      const createSpy = jest.spyOn(service, 'create').mockResolvedValue({} as any);

      await service.createGrouplessUserRecordIfNotExists(userId, loggerSpy);

      expect(service.getOriginalUserDoc).toHaveBeenCalledWith(userId, loggerSpy);
      expect(createSpy).not.toHaveBeenCalled();
      expect(loggerSpy.warn).toHaveBeenCalledWith({
        message: 'Failed to create stub user record, foreign key constraints may fail',
        userId: userId,
        error: 'Database connection failed',
      });
      expect(loggerSpy.debug).not.toHaveBeenCalled();
      expect(loggerSpy.info).not.toHaveBeenCalled();
    });

    it('should handle errors during user creation and log warning', async () => {
      const userId = 'create-error-user-id';
      const error = new Error('Insert failed');
      const loggerSpy = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
      } as any;

      // Mock getOriginalUserDoc to return null (user doesn't exist)
      jest.spyOn(service, 'getOriginalUserDoc').mockResolvedValue(null);

      // Mock create method to throw an error
      jest.spyOn(service, 'create').mockRejectedValue(error);

      await service.createGrouplessUserRecordIfNotExists(userId, loggerSpy);

      expect(service.getOriginalUserDoc).toHaveBeenCalledWith(userId, loggerSpy);
      expect(service.create).toHaveBeenCalledWith([{ id: userId }], loggerSpy);
      expect(loggerSpy.warn).toHaveBeenCalledWith({
        message: 'Failed to create stub user record, foreign key constraints may fail',
        userId: userId,
        error: 'Insert failed',
      });
      expect(loggerSpy.debug).not.toHaveBeenCalled();
      expect(loggerSpy.info).not.toHaveBeenCalled();
    });

    it('should handle non-Error exceptions during operation', async () => {
      const userId = 'non-error-exception-user-id';
      const nonErrorException = 'String error';
      const loggerSpy = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
      } as any;

      // Mock getOriginalUserDoc to throw a non-Error
      jest.spyOn(service, 'getOriginalUserDoc').mockRejectedValue(nonErrorException);

      await service.createGrouplessUserRecordIfNotExists(userId, loggerSpy);

      expect(service.getOriginalUserDoc).toHaveBeenCalledWith(userId, loggerSpy);
      expect(loggerSpy.warn).toHaveBeenCalledWith({
        message: 'Failed to create stub user record, foreign key constraints may fail',
        userId: userId,
        error: 'Unknown error',
      });
    });

    it('should execute the complete flow when user does not exist', async () => {
      const userId = 'flow-test-user-id';
      const loggerSpy = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
      } as any;

      // Mock getOriginalUserDoc to return null (user doesn't exist)
      jest.spyOn(service, 'getOriginalUserDoc').mockResolvedValue(null);

      // Mock create method to succeed
      const insertResult = {
        identifiers: [{ id: userId }],
        generatedMaps: [{ id: userId }],
        raw: [{ id: userId }],
      };
      jest.spyOn(service, 'create').mockResolvedValue(insertResult as any);

      await service.createGrouplessUserRecordIfNotExists(userId, loggerSpy);

      // Verify the complete flow
      expect(service.getOriginalUserDoc).toHaveBeenCalledTimes(1);
      expect(service.getOriginalUserDoc).toHaveBeenCalledWith(userId, loggerSpy);

      expect(service.create).toHaveBeenCalledTimes(1);
      expect(service.create).toHaveBeenCalledWith([{ id: userId }], loggerSpy);

      expect(loggerSpy.info).toHaveBeenCalledTimes(1);
      expect(loggerSpy.info).toHaveBeenCalledWith({
        message: 'Created stub user record for foreign key constraint satisfaction',
        userId: userId,
      });

      expect(loggerSpy.debug).not.toHaveBeenCalled();
      expect(loggerSpy.warn).not.toHaveBeenCalled();
    });
  });
});
