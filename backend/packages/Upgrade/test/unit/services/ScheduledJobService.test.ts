import { ScheduledJobService } from '../../../src/api/services/ScheduledJobService';
import { DataSource, Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { ScheduledJobRepository } from '../../../src/api/repositories/ScheduledJobRepository';
import { ErrorRepository } from '../../../src/api/repositories/ErrorRepository';
import { ExperimentAuditLogRepository } from '../../../src/api/repositories/ExperimentAuditLogRepository';
import { SCHEDULE_TYPE } from '../../../src/api/models/ScheduledJob';
import { Experiment } from '../../../src/api/models/Experiment';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { ScheduledJob } from '../../../src/api/models/ScheduledJob';
import { ExperimentRepository } from '../../../src/api/repositories/ExperimentRepository';
import { UserRepository } from '../../../src/api/repositories/UserRepository';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { Container as tteContainer } from '../../../src/typeorm-typedi-extensions';
import { configureLogger } from '../../utils/logger';
import { ExperimentAuditLog } from '../../../src/api/models/ExperimentAuditLog';
import { ExperimentError } from '../../../src/api/models/ExperimentError';

describe('Scheduled Job Service Testing', () => {
  let service: ScheduledJobService;
  let scheduledJobRepo: Repository<ScheduledJobRepository>;
  let module: TestingModule;
  let dataSource: DataSource;
  const logger = new UpgradeLogger();

  const mockjob1 = new ScheduledJob();
  mockjob1.id = 'id1';
  mockjob1.type = SCHEDULE_TYPE.START_EXPERIMENT;
  mockjob1.executionArn = 'arn1';
  mockjob1.timeStamp = new Date();
  const exp = new Experiment();
  exp.id = 'exp1';
  mockjob1.experiment = exp;

  const mockjob2 = new ScheduledJob();
  mockjob2.id = 'id2';
  mockjob2.type = SCHEDULE_TYPE.END_EXPERIMENT;
  mockjob2.timeStamp = new Date();

  const scheduledJobArr = [mockjob1, mockjob2];

  let clearLogsSpy = jest.fn().mockImplementation(() => {
    throw new Error();
  });

  const queryBuilderMock = {
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([mockjob1]),
  };

  beforeAll(() => {
    configureLogger();
  });

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      database: 'postgres',
      entities: [ScheduledJob, ExperimentAuditLog, ExperimentError],
      synchronize: true,
    });
    const entityManagerMock = { createQueryBuilder: () => queryBuilderMock, getRepository: () => scheduledJobRepo };
    const mockTransaction = jest.fn(async (passedFunction) => await passedFunction(entityManagerMock));
    dataSource.transaction = mockTransaction;
    tteContainer.setDataSource('default', dataSource);

    module = await Test.createTestingModule({
      providers: [
        DataSource,
        ScheduledJobService,
        ScheduledJobRepository,
        ExperimentAuditLogRepository,
        ErrorRepository,
        ExperimentService,
        {
          provide: getDataSourceToken('default'),
          useValue: dataSource,
        },
        {
          provide: getRepositoryToken(ScheduledJobRepository),
          useValue: {
            find: jest.fn().mockResolvedValue(scheduledJobArr),
            findBy: jest.fn().mockResolvedValue(scheduledJobArr),
            delete: jest.fn().mockReturnThis(),
            upsertScheduledJob: jest.fn().mockResolvedValue(true),
            findOne: jest.fn().mockResolvedValue(mockjob1),
            findOneBy: jest.fn().mockResolvedValue(mockjob1),
            update: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: getRepositoryToken(ExperimentRepository),
          useValue: {
            findOne: jest.fn().mockResolvedValue(exp),
          },
        },
        {
          provide: getRepositoryToken(UserRepository),
          useValue: {
            findOne: jest.fn().mockResolvedValue(exp),
          },
        },
        {
          provide: getRepositoryToken(ErrorRepository),
          useValue: {
            clearLogs: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: getRepositoryToken(ExperimentAuditLogRepository),
          useValue: {
            clearLogs: clearLogsSpy,
          },
        },
        {
          provide: ExperimentService,
          useValue: {
            updateState: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<ScheduledJobService>(ScheduledJobService);
    scheduledJobRepo = module.get<Repository<ScheduledJobRepository>>(getRepositoryToken(ScheduledJobRepository));
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  it('should get all start experiments', async () => {
    const results = await service.getAllStartExperiment(logger);
    expect(scheduledJobRepo.find).toBeCalledWith({
      where: { type: SCHEDULE_TYPE.START_EXPERIMENT },
      relations: ['experiment'],
    });
    expect(results).toEqual(scheduledJobArr);
  });

  it('should get all end experiments', async () => {
    const results = await service.getAllEndExperiment(logger);
    expect(scheduledJobRepo.find).toBeCalledWith({
      where: { type: SCHEDULE_TYPE.END_EXPERIMENT },
      relations: ['experiment'],
    });
    expect(results).toEqual(scheduledJobArr);
  });

  it('should not clear logs when an error occurs', async () => {
    clearLogsSpy = jest.fn().mockResolvedValue(true);
    const result = await service.clearLogs(logger);
    expect(result).toBeFalsy();
  });

  it('should clear all logs', async () => {
    const result = await service.clearLogs(logger);
    expect(result).toBeTruthy();
  });

  it('should start the experiment', async () => {
    const exp = new Experiment();
    exp.state = EXPERIMENT_STATE.SCHEDULED;

    const res = await service.startExperiment(exp.id, logger);
    expect(res).toStrictEqual([]);
  });

  it('should return empty when no job to start', async () => {
    const exp = new Experiment();
    exp.state = EXPERIMENT_STATE.SCHEDULED;
    scheduledJobRepo.findOne = jest.fn().mockResolvedValue(mockjob2);
    const res = await service.startExperiment(exp.id, logger);
    expect(res).toStrictEqual({});
  });

  it('should throw an error when starting if the time difference is more than 5 hours', async () => {
    const exp = new Experiment();
    exp.state = EXPERIMENT_STATE.SCHEDULED;
    mockjob1.timeStamp = new Date('2019-01-20');

    const mockDate = new Date(2022, 3, 1);
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    const res = await service.startExperiment(exp.id, logger);
    expect(res).toStrictEqual(
      new Error('Error in start experiment of scheduler: Time Difference of more than 5 hours is found')
    );
  });

  it('should end the experiment', async () => {
    const exp = new Experiment();
    exp.state = EXPERIMENT_STATE.ENROLLING;
    mockjob1.timeStamp = new Date();

    const res = await service.endExperiment(exp.id, logger);
    expect(res).toStrictEqual([]);
  });

  it('should throw an error when ending if the time difference is more than 5 hours', async () => {
    const exp = new Experiment();
    exp.state = EXPERIMENT_STATE.SCHEDULED;

    mockjob1.timeStamp = new Date('2019-01-20');
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2020, 3, 1));
    const res = await service.endExperiment(exp.id, logger);
    expect(res).toStrictEqual(
      new Error('Error in end experiment of scheduler: Time Difference of more than 5 hours is found')
    );
  });

  it('should return empty when no experiment to stop', async () => {
    const exp = new Experiment();
    exp.state = EXPERIMENT_STATE.SCHEDULED;
    mockjob1.timeStamp = new Date();

    scheduledJobRepo.findOne = jest.fn().mockResolvedValueOnce(mockjob1);
    scheduledJobRepo.findOneBy = jest.fn().mockResolvedValueOnce(null);
    const res = await service.endExperiment(exp.id, logger);
    expect(res).toStrictEqual({});
  });
});
