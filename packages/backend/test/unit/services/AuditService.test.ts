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
    const flags = await service.getTotalLogs({ filter: LOG_TYPE.EXPERIMENT_CREATED });
    expect(flags).toEqual(auditArr.length);
  });

  it('should return a count of audit logs with no filter', async () => {
    const flags = await service.getTotalLogs({});
    expect(flags).toEqual(auditArr.length);
  });

  it('should return a count of audit logs with experimentId', async () => {
    const experimentId = '550e8400-e29b-41d4-a716-446655440000';
    const flags = await service.getTotalLogs({ filter: LOG_TYPE.EXPERIMENT_CREATED, experimentId });
    expect(flags).toEqual(auditArr.length);
    expect(repo.getTotalLogs).toHaveBeenCalledWith({ filter: LOG_TYPE.EXPERIMENT_CREATED, experimentId });
  });

  it('should return a count of audit logs with only experimentId (no filter)', async () => {
    const experimentId = '550e8400-e29b-41d4-a716-446655440000';
    const flags = await service.getTotalLogs({ experimentId });
    expect(flags).toEqual(auditArr.length);
    expect(repo.getTotalLogs).toHaveBeenCalledWith({ experimentId });
  });

  it('should return a count of audit logs with flagId', async () => {
    const flagId = '550e8400-e29b-41d4-a716-446655440001';
    const flags = await service.getTotalLogs({ filter: LOG_TYPE.FEATURE_FLAG_UPDATED, flagId });
    expect(flags).toEqual(auditArr.length);
    expect(repo.getTotalLogs).toHaveBeenCalledWith({ filter: LOG_TYPE.FEATURE_FLAG_UPDATED, flagId });
  });

  it('should return a count of audit logs with only flagId (no filter)', async () => {
    const flagId = '550e8400-e29b-41d4-a716-446655440001';
    const flags = await service.getTotalLogs({ flagId });
    expect(flags).toEqual(auditArr.length);
    expect(repo.getTotalLogs).toHaveBeenCalledWith({ flagId });
  });

  it('should return an array of audit logs', async () => {
    const flags = await service.getAuditLogs({ take: 1, skip: 0 });
    expect(flags).toEqual(auditArr);
  });

  it('should return an array of audit logs with experimentId', async () => {
    const experimentId = '550e8400-e29b-41d4-a716-446655440000';
    const flags = await service.getAuditLogs({ take: 1, skip: 0, experimentId });
    expect(flags).toEqual(auditArr);
    expect(repo.paginatedFind).toHaveBeenCalledWith({ take: 1, skip: 0, experimentId });
  });

  it('should return an array of audit logs with filter and experimentId', async () => {
    const experimentId = '550e8400-e29b-41d4-a716-446655440000';
    const flags = await service.getAuditLogs({ take: 1, skip: 0, filter: LOG_TYPE.EXPERIMENT_CREATED, experimentId });
    expect(flags).toEqual(auditArr);
    expect(repo.paginatedFind).toHaveBeenCalledWith({ take: 1, skip: 0, filter: LOG_TYPE.EXPERIMENT_CREATED, experimentId });
  });

  it('should return an array of audit logs with flagId', async () => {
    const flagId = '550e8400-e29b-41d4-a716-446655440001';
    const flags = await service.getAuditLogs({ take: 1, skip: 0, flagId });
    expect(flags).toEqual(auditArr);
    expect(repo.paginatedFind).toHaveBeenCalledWith({ take: 1, skip: 0, flagId });
  });

  it('should return an array of audit logs with filter and flagId', async () => {
    const flagId = '550e8400-e29b-41d4-a716-446655440001';
    const flags = await service.getAuditLogs({ take: 1, skip: 0, filter: LOG_TYPE.FEATURE_FLAG_UPDATED, flagId });
    expect(flags).toEqual(auditArr);
    expect(repo.paginatedFind).toHaveBeenCalledWith({ take: 1, skip: 0, filter: LOG_TYPE.FEATURE_FLAG_UPDATED, flagId });
  });

  it('should return an array of audit logs by type', async () => {
    const flags = await service.getAuditLogByType(LOG_TYPE.EXPERIMENT_CREATED);
    expect(flags).toEqual(auditArr);
  });
});
