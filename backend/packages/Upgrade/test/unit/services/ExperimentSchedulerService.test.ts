import { ExperimentSchedulerService } from '../../../src/api/services/ExperimentSchedulerService';
import { Repository } from 'typeorm';
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
import { ExperimentRepository } from '../../../src/api/repositories/ExperimentRepository';
import { UserRepository } from '../../../src/api/repositories/UserRepository';
import { configureLogger } from '../../utils/logger';

describe('Scheduled Job Service Testing', () => {
  let service: ExperimentSchedulerService;
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

  logger.error = errorSpy;

  beforeAll(() => {
    configureLogger();
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        ExperimentSchedulerService,
        ScheduledJobRepository,
        ExperimentAuditLogRepository,
        ErrorRepository,
        AWSService,
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
          provide: AWSService,
          useValue: {
            stepFunctionStartExecution: jest.fn().mockResolvedValue({ executionArn: 'arn' }),
            stepFunctionStopExecution: jest.fn().mockResolvedValue({ executionArn: 'arn' }),
          },
        },
      ],
    }).compile();

    service = module.get<ExperimentSchedulerService>(ExperimentSchedulerService);
    scheduledJobRepo = module.get<Repository<ScheduledJobRepository>>(getRepositoryToken(ScheduledJobRepository));
    awsService = module.get<AWSService>(AWSService);
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  it('should update the experiment schedules for an scheduled experiment that needs to start', async () => {
    const exp = new Experiment();
    exp.state = EXPERIMENT_STATE.SCHEDULED;
    exp.endOn = new Date('2019-01-20');
    scheduledJobRepo.findBy = jest.fn().mockResolvedValue([]);
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
    scheduledJobRepo.findBy = jest.fn().mockResolvedValue([]);
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
    scheduledJobRepo.findBy = jest.fn().mockImplementation(() => {
      throw new Error();
    });

    await service.updateExperimentSchedules(exp, logger);
    expect(errorSpy).toHaveBeenCalled();
  });
});
