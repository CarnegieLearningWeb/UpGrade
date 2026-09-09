import { ImportExportService } from '../../../src/api/services/ImportExportService';
import { ASSIGNMENT_ALGORITHM } from 'upgrade_types';

describe('ImportExportService', () => {
  let experimentService: any;
  let adaptiveExperimentConfigDispatcher: any;
  let service: ImportExportService;
  let logger: any;

  beforeEach(() => {
    experimentService = {
      create: jest.fn().mockImplementation((experiment) => Promise.resolve({ ...experiment })),
    };
    adaptiveExperimentConfigDispatcher = {
      createConfigIfApplicable: jest.fn().mockResolvedValue(undefined),
      attachConfigToExperiment: jest.fn().mockImplementation((experiment) => Promise.resolve(experiment)),
    };
    logger = { info: jest.fn(), error: jest.fn() };
    service = new ImportExportService({} as any, {} as any, experimentService, adaptiveExperimentConfigDispatcher);
  });

  describe('addBulkExperiments', () => {
    it('creates a Thompson Sampling config for an imported/batch-created THOMPSON_SAMPLING experiment', async () => {
      const experiment = {
        id: 'experiment-1',
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING,
        conditions: [{ id: 'condition-1' }],
        thompsonSamplingConfig: { priors: { 'condition-1': { success: 2, failure: 3 } } },
      } as any;

      await service.addBulkExperiments([experiment], {} as any, logger);

      // Without this call, an imported/batch-created THOMPSON_SAMPLING experiment previously got no
      // ThompsonSamplingExperimentConfig/ConditionPosteriorState rows at all (only the single-experiment
      // POST /experiments controller path wired this up), so assignment could never select a condition.
      expect(adaptiveExperimentConfigDispatcher.createConfigIfApplicable).toHaveBeenCalledWith(
        experiment,
        expect.objectContaining({ id: 'experiment-1' }),
        ['condition-1']
      );
    });

    it('captures condition ids before create() runs, so a caller that regenerates them can still be remapped', async () => {
      // ExperimentService.create() regenerates condition ids in place; a caller whose mock (or the
      // real service) does this must not lose the pre-creation ids the imported/batch-created
      // experiment's priors are keyed by -- addBulkExperiments has to snapshot them beforehand.
      experimentService.create.mockImplementation((experiment: any) =>
        Promise.resolve({
          ...experiment,
          conditions: experiment.conditions.map((condition: any) => ({ ...condition, id: `new-${condition.id}` })),
        })
      );
      const experiment = {
        id: 'experiment-1',
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING,
        conditions: [{ id: 'condition-1' }],
        thompsonSamplingConfig: { priors: { 'condition-1': { success: 2, failure: 3 } } },
      } as any;

      await service.addBulkExperiments([experiment], {} as any, logger);

      expect(adaptiveExperimentConfigDispatcher.createConfigIfApplicable).toHaveBeenCalledWith(
        experiment,
        expect.objectContaining({ conditions: [{ id: 'new-condition-1' }] }),
        ['condition-1']
      );
    });

    it('attaches the created config onto the returned experiment', async () => {
      const experiment = {
        id: 'experiment-1',
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING,
        conditions: [{ id: 'condition-1' }],
      } as any;
      adaptiveExperimentConfigDispatcher.attachConfigToExperiment.mockImplementation((exp: any) =>
        Promise.resolve({ ...exp, thompsonSamplingConfig: { priors: { 'condition-1': { success: 1, failure: 1 } } } })
      );

      const [result] = await service.addBulkExperiments([experiment], {} as any, logger);

      expect(result.thompsonSamplingConfig).toEqual({ priors: { 'condition-1': { success: 1, failure: 1 } } });
    });
  });
});
