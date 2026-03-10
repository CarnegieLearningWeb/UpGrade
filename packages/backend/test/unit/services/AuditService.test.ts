import { AuditService } from '../../../src/api/services/AuditService';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExperimentAuditLogRepository } from '../../../src/api/repositories/ExperimentAuditLogRepository';
import { LOG_TYPE } from 'upgrade_types';
import { configureLogger } from '../../utils/logger';

const auditArr = [1, 2, 3];

describe('Audit Service Testing', () => {
  let service: AuditService;
  let repo: ExperimentAuditLogRepository;
  let module: TestingModule;

  beforeAll(() => {
    configureLogger();
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        AuditService,
        ExperimentAuditLogRepository,
        {
          provide: getRepositoryToken(ExperimentAuditLogRepository),
          useValue: {
            find: jest.fn().mockResolvedValue(auditArr),
            paginatedFind: jest.fn().mockResolvedValue(auditArr),
            getTotalLogs: jest.fn().mockResolvedValue(auditArr.length),
            count: jest.fn().mockResolvedValue(auditArr.length),
          },
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    repo = module.get<ExperimentAuditLogRepository>(getRepositoryToken(ExperimentAuditLogRepository));
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  it('should have the repo mocked', async () => {
    expect(await repo.find()).toEqual(auditArr);
  });

  it('should return a count of audit logs', async () => {
    const flags = await service.getTotalLogs(LOG_TYPE.EXPERIMENT_CREATED);
    expect(flags).toEqual(auditArr.length);
  });

  it('should return a count of audit logs', async () => {
    const flags = await service.getTotalLogs(null);
    expect(flags).toEqual(auditArr.length);
  });

  it('should return a count of audit logs with experimentId', async () => {
    const experimentId = '550e8400-e29b-41d4-a716-446655440000';
    const flags = await service.getTotalLogs(LOG_TYPE.EXPERIMENT_CREATED, experimentId);
    expect(flags).toEqual(auditArr.length);
    expect(repo.getTotalLogs).toHaveBeenCalledWith(LOG_TYPE.EXPERIMENT_CREATED, experimentId);
  });

  it('should return a count of audit logs with only experimentId (no filter)', async () => {
    const experimentId = '550e8400-e29b-41d4-a716-446655440000';
    const flags = await service.getTotalLogs(undefined, experimentId);
    expect(flags).toEqual(auditArr.length);
    expect(repo.count).toHaveBeenCalledWith({ where: { id: experimentId } });
  });

  it('should return an array of audit logs', async () => {
    const flags = await service.getAuditLogs(1, 0);
    expect(flags).toEqual(auditArr);
  });

  it('should return an array of audit logs with experimentId', async () => {
    const experimentId = '550e8400-e29b-41d4-a716-446655440000';
    const flags = await service.getAuditLogs(1, 0, undefined, experimentId);
    expect(flags).toEqual(auditArr);
    expect(repo.paginatedFind).toHaveBeenCalledWith(1, 0, undefined, experimentId);
  });

  it('should return an array of audit logs with filter and experimentId', async () => {
    const experimentId = '550e8400-e29b-41d4-a716-446655440000';
    const flags = await service.getAuditLogs(1, 0, LOG_TYPE.EXPERIMENT_CREATED, experimentId);
    expect(flags).toEqual(auditArr);
    expect(repo.paginatedFind).toHaveBeenCalledWith(1, 0, LOG_TYPE.EXPERIMENT_CREATED, experimentId);
  });

  it('should return an array of audit logs by type', async () => {
    const flags = await service.getAuditLogByType(LOG_TYPE.EXPERIMENT_CREATED);
    expect(flags).toEqual(auditArr);
  });
});
