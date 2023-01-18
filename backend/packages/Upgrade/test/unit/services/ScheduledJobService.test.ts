import { ScheduledJobService } from '../../../src/api/services/ScheduledJobService';
import { Connection, ConnectionManager, Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { ScheduledJobRepository } from '../../../src/api/repositories/ScheduledJobRepository';
import { ErrorRepository } from '../../../src/api/repositories/ErrorRepository';
import { ExperimentAuditLogRepository } from '../../../src/api/repositories/ExperimentAuditLogRepository';
import { AWSService } from '../../../src/api/services/AWSService';
import { SCHEDULE_TYPE } from '../../../src/api/models/ScheduledJob';
import { Experiment } from '../../../src/api/models/Experiment';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { ScheduledJob } from '../../../src/api/models/ScheduledJob';
import * as sinon from 'sinon';
import { ExperimentRepository } from '../../../src/api/repositories/ExperimentRepository';
import { UserRepository } from '../../../src/api/repositories/UserRepository';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import Container from 'typedi';
import ExperimentServiceMock from '../controllers/mocks/ExperimentServiceMock';

describe('Scheduled Job Service Testing', () => {
  let service: ScheduledJobService;
  let scheduledJobRepo: Repository<ScheduledJobRepository>;
  let awsService: AWSService;
  let module: TestingModule;
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

  const errorSpy = jest.fn();
  let clearLogsSpy = jest.fn().mockImplementation(() => {
    throw new Error();
  });
  logger.error = errorSpy;

  const queryBuilderMock = {
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([mockjob1]),
  };

  const sandbox = sinon.createSandbox();

  const entityManagerMock = { createQueryBuilder: () => queryBuilderMock, getRepository: () => scheduledJobRepo };
  sandbox.stub(ConnectionManager.prototype, 'get').returns({
    transaction: jest.fn(async (passedFunction) => await passedFunction(entityManagerMock)),
  } as unknown as Connection);

  beforeEach(async () => {
    Container.set(ExperimentService, new ExperimentServiceMock());

    module = await Test.createTestingModule({
      providers: [
        ScheduledJobService,
        ScheduledJobRepository,
        ExperimentAuditLogRepository,
        ErrorRepository,
        AWSService,
        {
          provide: getRepositoryToken(ScheduledJobRepository),
          useValue: {
            find: jest.fn().mockResolvedValue(scheduledJobArr),
            delete: jest.fn().mockReturnThis(),
            upsertScheduledJob: jest.fn().mockResolvedValue(true),
            findOne: jest.fn().mockResolvedValue(mockjob1),
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
          provide: AWSService,
          useValue: {
            stepFunctionStartExecution: jest.fn().mockResolvedValue({ executionArn: 'arn' }),
            stepFunctionStopExecution: jest.fn().mockResolvedValue({ executionArn: 'arn' }),
          },
        },
      ],
    }).compile();

    service = module.get<ScheduledJobService>(ScheduledJobService);
    scheduledJobRepo = module.get<Repository<ScheduledJobRepository>>(getRepositoryToken(ScheduledJobRepository));
    awsService = module.get<AWSService>(AWSService);
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

  it('should update the experiment schedules for an scheduled experiment that needs to start', async () => {
    const exp = new Experiment();
    exp.state = EXPERIMENT_STATE.SCHEDULED;
    exp.endOn = new Date('2019-01-20');
    scheduledJobRepo.find = jest.fn().mockResolvedValue([]);
    await service.updateExperimentSchedules(exp, logger);
    expect(awsService.stepFunctionStartExecution).toBeCalled();
  });

  it('should update the experiment schedules for enrollment complete', async () => {
    const exp = new Experiment();
    exp.state = EXPERIMENT_STATE.ENROLLMENT_COMPLETE;
    await service.updateExperimentSchedules(exp, logger);
    expect(scheduledJobRepo.delete).toBeCalledTimes(2);
    expect(awsService.stepFunctionStartExecution).not.toBeCalled();
    expect(awsService.stepFunctionStopExecution).toBeCalledTimes(2);
  });

  it('should update the experiment schedules for a scheduled experiment that needs to stop', async () => {
    const exp = new Experiment();
    exp.state = EXPERIMENT_STATE.SCHEDULED;
    exp.endOn = new Date('2019-01-20');
    exp.startOn = new Date('2019-01-16');
    mockjob2.executionArn = 'arn2';
    await service.updateExperimentSchedules(exp, logger);
    expect(awsService.stepFunctionStopExecution).toBeCalledTimes(2);
    expect(awsService.stepFunctionStartExecution).toBeCalledTimes(2);
  });

  it('should update the experiment schedules for an scheduled experiment that needs to start', async () => {
    const exp = new Experiment();
    exp.state = EXPERIMENT_STATE.SCHEDULED;
    exp.startOn = mockjob1.timeStamp;
    exp.endOn = new Date('2019-01-19');
    await service.updateExperimentSchedules(exp, logger);
    expect(awsService.stepFunctionStartExecution).toBeCalled();
  });

  it('should do nothing for enrollment complete with no found scheduled jobs', async () => {
    const exp = new Experiment();
    exp.state = EXPERIMENT_STATE.ENROLLMENT_COMPLETE;
    scheduledJobRepo.find = jest.fn().mockResolvedValue([]);
    await service.updateExperimentSchedules(exp, logger);
    expect(scheduledJobRepo.delete).not.toBeCalled();
    expect(awsService.stepFunctionStartExecution).not.toBeCalled();
    expect(awsService.stepFunctionStopExecution).not.toBeCalled();
  });

  it('should create end schedule of state that is not complete and date changes if experiment is already scheduled with old date', async () => {
    const exp = new Experiment();
    exp.state = EXPERIMENT_STATE.SCHEDULED;
    exp.endOn = new Date('2019-01-14');
    exp.startOn = new Date('2019-01-10');
    delete scheduledJobArr[1].executionArn;
    await service.updateExperimentSchedules(exp, logger);
    expect(awsService.stepFunctionStartExecution).toBeCalled();
  });

  it('should create end schedule of state that is not complete and date changes', async () => {
    const exp = new Experiment();
    exp.state = EXPERIMENT_STATE.SCHEDULED;
    exp.endOn = mockjob2.timeStamp;
    exp.startOn = new Date('2019-01-10');
    delete scheduledJobArr[1].executionArn;
    await service.updateExperimentSchedules(exp, logger);
    expect(awsService.stepFunctionStartExecution).toBeCalled();
  });

  it('should catch an error on update', async () => {
    const exp = new Experiment();
    exp.state = EXPERIMENT_STATE.SCHEDULED;
    scheduledJobRepo.find = jest.fn().mockImplementation(() => {
      throw new Error();
    });

    await service.updateExperimentSchedules(exp, logger);
    expect(errorSpy).toBeCalled();
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
    jest.spyOn(global, "Date").mockImplementation(() => (mockDate as unknown) as string);
    let res = await service.startExperiment(exp.id, logger);
    expect(res).toStrictEqual(new Error('Error in start experiment of scheduler: Time Difference of more than 5 hours is found'))
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
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date(2020, 3, 1));
    let res = await service.endExperiment(exp.id, logger);
    expect(res).toStrictEqual(new Error('Error in end experiment of scheduler: Time Difference of more than 5 hours is found'))

  });

  it('should return empty when no experiment to stop', async () => {
    const exp = new Experiment();
    exp.state = EXPERIMENT_STATE.SCHEDULED;
    mockjob1.timeStamp = new Date();

    scheduledJobRepo.findOne = jest.fn().mockResolvedValueOnce(mockjob1).mockResolvedValueOnce(null);
    const res = await service.endExperiment(exp.id, logger);
    expect(res).toStrictEqual({});
  });
});
