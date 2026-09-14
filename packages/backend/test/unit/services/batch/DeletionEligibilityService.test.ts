import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { DeletionReasonCode, EXPERIMENT_STATE, FEATURE_FLAG_STATUS, SEGMENT_STATUS, SEGMENT_TYPE } from 'upgrade_types';
import { DeletionEligibilityService } from '../../../../src/api/services/batch/DeletionEligibilityService';
import { SegmentService } from '../../../../src/api/services/SegmentService';

const methods = ['experiments', 'flags', 'segments'] as const;

describe('Internal batch deletion eligibility', () => {
  const id = randomUUID();
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

  test('preserves experiment state aliases and reports missing IDs in request order', async () => {
    const states = [
      EXPERIMENT_STATE.INACTIVE,
      EXPERIMENT_STATE.ENROLLING,
      EXPERIMENT_STATE.ENROLLMENT_COMPLETE,
      EXPERIMENT_STATE.CANCELLED,
      EXPERIMENT_STATE.ARCHIVED,
      EXPERIMENT_STATE.DRAFT,
      EXPERIMENT_STATE.PREVIEW,
      EXPERIMENT_STATE.SCHEDULED,
    ];
    const rows = states.map((state) => ({ id: randomUUID(), state }));
    find.mockResolvedValue([...rows].reverse());
    const ids = [...rows.map((row) => row.id.toUpperCase()), randomUUID()];
    const result = await service.experiments(ids);
    expect(result.items.map((item) => item.id)).toEqual(ids);
    expect(result.items.map((item) => item.canDelete)).toEqual([
      true,
      true,
      true,
      true,
      true,
      false,
      false,
      false,
      false,
    ]);
    expect(result.items[result.items.length - 1].reasonCode).toBe(DeletionReasonCode.NOT_FOUND);
  });

  test('allows disabled and archived flags while rejecting enabled flags', async () => {
    const rows = [FEATURE_FLAG_STATUS.DISABLED, FEATURE_FLAG_STATUS.ARCHIVED, FEATURE_FLAG_STATUS.ENABLED].map(
      (status) => ({ id: randomUUID(), status })
    );
    find.mockResolvedValue(rows);
    const result = await service.flags(rows.map((row) => row.id));
    expect(result.items.map((item) => item.canDelete)).toEqual([true, true, false]);
    expect(result.items[2].reasonCode).toBe(DeletionReasonCode.FEATURE_FLAG_ENABLED);
  });

  test.each(methods)('%s propagates database failure instead of reporting absence', async (method) => {
    const failure = new Error('Database unavailable');
    find.mockRejectedValue(failure);
    getMany.mockRejectedValue(failure);
    await expect(service[method]([id])).rejects.toBe(failure);
    expect(getSegmentStatus).not.toHaveBeenCalled();
  });

  test('propagates a failed shared segment status read', async () => {
    const failure = new Error('Status read failed');
    getSegmentStatus.mockRejectedValue(failure);
    await expect(service.segments([id])).rejects.toBe(failure);
  });

  test('does not declare an existing segment deletable when its derived status is unavailable', async () => {
    getSegmentStatus.mockResolvedValue({ segmentsData: [] });
    const result = await service.segments([id]);
    expect(result.items[0]).toMatchObject({
      id,
      availability: 'unavailable',
      canDelete: false,
      reasonCode: DeletionReasonCode.ELIGIBILITY_UNAVAILABLE,
    });
  });

  test('does not run global status reads when no selected segment exists', async () => {
    getMany.mockResolvedValue([]);
    const result = await service.segments([id]);
    expect(result.items[0]).toMatchObject({ availability: 'not_found', canDelete: false });
    expect(getSegmentStatus).not.toHaveBeenCalled();
  });
});
