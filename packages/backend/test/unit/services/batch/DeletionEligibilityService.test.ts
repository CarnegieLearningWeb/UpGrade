import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import {
  DeletionReasonCode,
  EXPERIMENT_STATE,
  FEATURE_FLAG_STATUS,
  SEGMENT_STATUS,
  SEGMENT_TYPE,
  UserRole,
} from 'upgrade_types';
import { DeletionEligibilityService } from '../../../../src/api/services/batch/DeletionEligibilityService';
import { SegmentService } from '../../../../src/api/services/SegmentService';

const methods = ['experiments', 'flags', 'segments'] as const;

describe('DeletionEligibilityService failure handling', () => {
  const id = randomUUID();
  const admin = { email: 'test@example.com', firstName: 'Test', lastName: 'User', role: UserRole.ADMIN };
  let service: DeletionEligibilityService;
  let find: jest.Mock;
  let getMany: jest.Mock;
  let getRepository: jest.Mock;
  let getSegmentStatus: jest.Mock;
  beforeEach(() => {
    const row = {
      id,
      name: 'Selected',
      state: EXPERIMENT_STATE.INACTIVE,
      status: FEATURE_FLAG_STATUS.DISABLED,
      type: SEGMENT_TYPE.PUBLIC,
      subSegments: [],
    };
    find = jest.fn().mockResolvedValue([row]);
    getMany = jest.fn().mockResolvedValue([row]);
    const builder = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany,
    };
    getRepository = jest.fn().mockReturnValue({ find, createQueryBuilder: () => builder });
    getSegmentStatus = jest.fn().mockResolvedValue({ segmentsData: [{ ...row, status: SEGMENT_STATUS.UNUSED }] });
    service = new DeletionEligibilityService(
      { getRepository } as unknown as DataSource,
      { getSegmentStatus } as unknown as SegmentService
    );
  });

  test.each(methods)('%s requires a current user before querying', async (method) => {
    await expect(service[method]([id], undefined)).rejects.toMatchObject({ httpCode: 401 });
    expect(getRepository).not.toHaveBeenCalled();
  });

  test.each(methods)('%s denies missing and unknown roles', async (method) => {
    for (const role of [undefined, null, 'unknown' as UserRole]) {
      const result = await service[method]([id], { ...admin, role });
      expect(result.allDeletable).toBe(false);
      expect(result.items[0]).toMatchObject({
        availability: 'present',
        canDelete: false,
        reasonCode: DeletionReasonCode.MISSING_PERMISSION,
      });
    }
  });

  test.each(methods)('%s propagates database failure instead of reporting absence', async (method) => {
    const failure = new Error('Database unavailable');
    find.mockRejectedValue(failure);
    getMany.mockRejectedValue(failure);
    await expect(service[method]([id], admin)).rejects.toBe(failure);
    expect(getSegmentStatus).not.toHaveBeenCalled();
  });

  test('propagates a failed shared segment status read', async () => {
    const failure = new Error('Status read failed');
    getSegmentStatus.mockRejectedValue(failure);
    await expect(service.segments([id], admin)).rejects.toBe(failure);
  });

  test('does not declare an existing segment deletable when its derived status is unavailable', async () => {
    getSegmentStatus.mockResolvedValue({ segmentsData: [] });
    const result = await service.segments([id], admin);
    expect(result.items[0]).toMatchObject({
      id,
      availability: 'unavailable',
      canDelete: false,
      reasonCode: DeletionReasonCode.ELIGIBILITY_UNAVAILABLE,
    });
    expect(result.allDeletable).toBe(false);
  });

  test('does not run global status reads when no selected segment exists', async () => {
    getMany.mockResolvedValue([]);
    const result = await service.segments([id], admin);
    expect(result.items[0]).toMatchObject({ availability: 'not_found', canDelete: false });
    expect(getSegmentStatus).not.toHaveBeenCalled();
  });
});
