import { ErrorService } from '../../../src/api/services/ErrorService';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ErrorRepository } from '../../../src/api/repositories/ErrorRepository';
import { ExperimentError } from '../../../src/api/models/ExperimentError';
import { SERVER_ERROR } from 'upgrade_types';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';

const errorArr = [1, 2, 3];
const error = new ExperimentError();
const logger = new UpgradeLogger();

describe('Error Service Testing', () => {
  let service: ErrorService;
  let repo: Repository<ErrorRepository>;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        ErrorService,
        ErrorRepository,
        {
          provide: getRepositoryToken(ErrorRepository),
          useValue: {
            find: jest.fn().mockResolvedValue(errorArr),
            paginatedFind: jest.fn().mockResolvedValue(errorArr),
            getTotalLogs: jest.fn().mockResolvedValue(errorArr.length),
            count: jest.fn().mockResolvedValue(errorArr.length),
            save: jest.fn().mockResolvedValue(error),
          },
        },
      ],
    }).compile();

    service = module.get<ErrorService>(ErrorService);
    repo = module.get<Repository<ErrorRepository>>(getRepositoryToken(ErrorRepository));
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  it('should have the repo mocked', async () => {
    expect(await repo.find()).toEqual(errorArr);
  });

  it('should return a count of error logs', async () => {
    const flags = await service.getTotalLogs(SERVER_ERROR.QUERY_FAILED);
    expect(flags).toEqual(errorArr.length);
  });

  it('should return a count of error logs', async () => {
    const flags = await service.getTotalLogs(null);
    expect(flags).toEqual(errorArr.length);
  });

  it('should return an array of error logs', async () => {
    const flags = await service.getErrorLogs(1, 0, SERVER_ERROR.QUERY_FAILED);
    expect(flags).toEqual(errorArr);
  });

  it('should return an error log', async () => {
    const flags = await service.create(error, logger);
    expect(flags).toBe(error);
  });

  it('should throw an error when unable to save', async () => {
    const err = new Error('insert error');
    repo.save = jest.fn().mockRejectedValue(err);
    expect(async () => {
      await service.create(error, logger);
    }).rejects.toThrow(err);
  });
});
