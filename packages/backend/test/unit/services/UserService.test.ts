import { UserService } from '../../../src/api/services/UserService';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRepository } from '../../../src/api/repositories/UserRepository';
import { User } from '../../../src/api/models/User';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { USER_SEARCH_SORT_KEY } from '../../../src/api/controllers/validators/UserPaginatedParamsValidator';
import { SORT_AS_DIRECTION, UserRole } from 'upgrade_types';
import { AWSService } from '../../../src/api/services/AWSService';
import { Emails } from '../../../src/templates/email';
import UserServiceMock from '../controllers/mocks/UserServiceMock';
import { configureLogger } from '../../utils/logger';

describe('User Service Testing', () => {
  let service: UserService;
  let serviceMock: UserServiceMock;
  let repo: Repository<UserRepository>;
  let module: TestingModule;
  const logger = new UpgradeLogger();

  const mockUser1 = new User();
  mockUser1.firstName = 'Bruce';
  mockUser1.lastName = 'Banner';
  mockUser1.email = 'bb@email.com';

  const mockUser2 = new User();
  mockUser2.firstName = 'Peter';
  mockUser2.lastName = 'Parker';
  mockUser2.email = 'pp@email.com';

  const mockUser3 = new User();
  mockUser3.firstName = 'Scott';
  mockUser3.lastName = 'Summers';
  mockUser3.email = 'ss@email.com';

  const userArr = [mockUser1, mockUser2, mockUser3];

  const limitSpy = jest.fn().mockReturnThis();
  const offsetSpy = jest.fn().mockReturnThis();
  const andWhereSpy = jest.fn().mockReturnThis();
  const setParamaterSpy = jest.fn().mockReturnThis();
  const addOrderBySpy = jest.fn().mockReturnThis();

  beforeAll(() => {
    configureLogger();
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        AWSService,
        Emails,
        UserService,
        UserServiceMock,
        UserRepository,
        {
          provide: getRepositoryToken(UserRepository),
          useValue: {
            find: jest.fn().mockResolvedValue(userArr),
            upsertUser: jest.fn().mockResolvedValue(mockUser1),
            count: jest.fn().mockResolvedValue(userArr.length),
            findByIds: jest.fn().mockResolvedValue(userArr.slice(1, 2)),
            updateUserDetails: jest.fn().mockResolvedValue(mockUser1),
            deleteUserByEmail: jest.fn().mockResolvedValue(mockUser1),
            createQueryBuilder: jest.fn(() => ({
              andWhere: andWhereSpy,
              addOrderBy: addOrderBySpy,
              setParameter: setParamaterSpy,
              where: jest.fn().mockReturnThis(),
              offset: offsetSpy,
              limit: limitSpy,
              getMany: jest.fn().mockResolvedValue(userArr),
              clone: jest.fn().mockReturnThis(),
              getCount: jest.fn().mockResolvedValue(userArr.length - 1),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    serviceMock = module.get<UserServiceMock>(UserServiceMock);
    repo = module.get<Repository<UserRepository>>(getRepositoryToken(UserRepository));
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  it('should have the repo mocked', async () => {
    expect(await repo.find()).toEqual(userArr);
  });

  it('should upsert a user', async () => {
    const user = await service.upsertUser(mockUser1, logger);
    expect(user).toEqual(mockUser1);
  });

  it('should find all users', async () => {
    const users = await service.find(logger);
    expect(users).toEqual(userArr);
  });

  it('should return a count of user logs', async () => {
    const users = await service.getTotalCount(logger);
    expect(users).toEqual(userArr.length - 1);
  });

  it('should return users by email', async () => {
    const users = await service.getUserByEmail('pp@email.com');
    expect(repo.findByIds).toBeCalledWith(['pp@email.com']);
    expect(users).toEqual([mockUser2]);
  });

  it('should return paginated users', async () => {
    const users = await service.findPaginated(1, 2, logger);
    expect(repo.createQueryBuilder).toBeCalledWith('users');
    expect(offsetSpy).toBeCalledWith(1);
    expect(limitSpy).toBeCalledWith(2);
    expect(users).toEqual([userArr, 2]);
  });

  it('should return paginated users with search params', async () => {
    const params = {
      key: USER_SEARCH_SORT_KEY.FIRST_NAME,
      string: 'Bruce',
    };
    const users = await service.findPaginated(0, 0, logger, params);
    expect(repo.createQueryBuilder).toBeCalledWith('users');
    expect(offsetSpy).toBeCalledWith(0);
    expect(limitSpy).toBeCalledWith(0);
    expect(users).toEqual([userArr, 2]);
    expect(andWhereSpy).toBeCalledWith('(users."firstName"::TEXT ILIKE \'%Bruce%\')');
  });

  it('should return paginated users with sort params', async () => {
    const searchParams = {
      key: USER_SEARCH_SORT_KEY.LAST_NAME,
      string: 'Bruce',
    };
    const sortParams = {
      key: USER_SEARCH_SORT_KEY.FIRST_NAME,
      sortAs: SORT_AS_DIRECTION.DESCENDING,
    };
    const users = await service.findPaginated(0, 0, logger, searchParams, sortParams);
    expect(repo.createQueryBuilder).toBeCalledWith('users');
    expect(offsetSpy).toBeCalledWith(0);
    expect(limitSpy).toBeCalledWith(0);
    expect(addOrderBySpy).toBeCalledWith(`users.${sortParams.key}`, sortParams.sortAs);
    expect(users).toEqual([userArr, 2]);
    expect(andWhereSpy).toBeCalledWith('(users."firstName"::TEXT ILIKE \'%Bruce%\')');
  });

  it('should update the User Details', async () => {
    const user = await serviceMock.updateUserDetails('fn', 'ln', 'bb@email.com', UserRole.CREATOR);
    expect(user).toEqual([]);
  });

  it('should delete the user by email', async () => {
    const user = await service.deleteUser('bb@email.com');
    expect(user).toEqual(mockUser1);
  });

  it('should format search string for first name', async () => {
    const params = {
      key: USER_SEARCH_SORT_KEY.FIRST_NAME,
      string: 'Bruce',
    };
    await service.findPaginated(0, 0, logger, params);
    expect(andWhereSpy).toBeCalledWith('(users."firstName"::TEXT ILIKE \'%Bruce%\')');
  });

  it('should format search string for last name', async () => {
    const params = {
      key: USER_SEARCH_SORT_KEY.LAST_NAME,
      string: 'Bruce',
    };
    await service.findPaginated(0, 0, logger, params);
    expect(andWhereSpy).toBeCalledWith('(users."lastName"::TEXT ILIKE \'%Bruce%\')');
  });

  it('should format search string for email', async () => {
    const params = {
      key: USER_SEARCH_SORT_KEY.EMAIL,
      string: 'Bruce',
    };
    await service.findPaginated(0, 0, logger, params);
    expect(andWhereSpy).toBeCalledWith('(users."email"::TEXT ILIKE \'%Bruce%\')');
  });

  it('should format search string for role', async () => {
    const params = {
      key: USER_SEARCH_SORT_KEY.ROLE,
      string: 'Bruce',
    };
    await service.findPaginated(0, 0, logger, params);
    expect(andWhereSpy).toBeCalledWith('(users."role"::TEXT ILIKE \'%Bruce%\')');
  });

  it('should format search string for all', async () => {
    const params = {
      key: USER_SEARCH_SORT_KEY.ALL,
      string: 'Bruce',
    };
    await service.findPaginated(0, 0, logger, params);
    expect(andWhereSpy).toBeCalledWith('(users."role"::TEXT ILIKE \'%Bruce%\')');
  });
});
