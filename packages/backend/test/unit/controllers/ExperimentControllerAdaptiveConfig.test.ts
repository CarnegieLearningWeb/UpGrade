import { ExperimentController } from '../../../src/api/controllers/ExperimentController';
import { ASSIGNMENT_ALGORITHM } from 'upgrade_types';

describe('ExperimentController adaptive config wiring', () => {
  let experimentService: any;
  let adaptiveExperimentConfigDispatcher: any;
  let controller: ExperimentController;
  let request: any;

  beforeEach(() => {
    experimentService = {
      validateExperimentContext: jest.fn().mockReturnValue(undefined),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
      getSingleExperiment: jest.fn(),
    };
    adaptiveExperimentConfigDispatcher = {
      createConfigIfApplicable: jest.fn().mockResolvedValue(undefined),
      syncConfigIfApplicable: jest.fn().mockResolvedValue(undefined),
      attachConfigToExperiment: jest.fn().mockImplementation((experiment) => Promise.resolve(experiment)),
    };
    request = { logger: { child: jest.fn(), error: jest.fn(), info: jest.fn() } };

    controller = new ExperimentController(
      experimentService,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      adaptiveExperimentConfigDispatcher
    );
  });

  describe('create()', () => {
    it('captures condition ids before create() runs and forwards them to createConfigIfApplicable', async () => {
      const experiment = {
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING,
        conditions: [{ id: 'client-temp-id-1' }, { id: 'client-temp-id-2' }],
        thompsonSamplingConfig: { priors: { 'client-temp-id-1': { success: 2, failure: 3 } } },
      } as any;
      // Mirrors what ExperimentService.create() actually does: mutate condition ids in place.
      experimentService.create.mockImplementation((exp: any) => {
        exp.conditions.forEach((condition: any, index: number) => {
          condition.id = `server-id-${index + 1}`;
        });
        return Promise.resolve({ ...exp, id: 'experiment-1' });
      });

      await controller.create(experiment, {} as any, request);

      expect(adaptiveExperimentConfigDispatcher.createConfigIfApplicable).toHaveBeenCalledWith(
        expect.objectContaining({ conditions: [{ id: 'server-id-1' }, { id: 'server-id-2' }] }),
        expect.objectContaining({ id: 'experiment-1' }),
        ['client-temp-id-1', 'client-temp-id-2']
      );
    });

    it('deletes the just-created experiment and rethrows when config creation fails', async () => {
      const experiment = { assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING, conditions: [] } as any;
      experimentService.create.mockResolvedValue({ id: 'experiment-1', conditions: [] });
      const configError = new Error('config create failed');
      adaptiveExperimentConfigDispatcher.createConfigIfApplicable.mockRejectedValue(configError);

      await expect(controller.create(experiment, {} as any, request)).rejects.toThrow(configError);

      expect(experimentService.delete).toHaveBeenCalledWith('experiment-1', {}, { logger: request.logger });
    });
  });

  describe('update()', () => {
    it('does not touch previous state on the happy path', async () => {
      const experiment = { assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING, conditions: [] } as any;
      const previousExperiment = { id: 'experiment-1', assignmentAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM };
      experimentService.getSingleExperiment.mockResolvedValue(previousExperiment);
      experimentService.update.mockResolvedValue({ id: 'experiment-1', conditions: [] });

      await controller.update({ id: 'experiment-1' } as any, experiment, {} as any, request);

      expect(experimentService.update).toHaveBeenCalledTimes(1);
      expect(adaptiveExperimentConfigDispatcher.syncConfigIfApplicable).toHaveBeenCalledTimes(1);
    });

    it('reverts the experiment and re-syncs the config when syncConfigIfApplicable fails', async () => {
      const experiment = { assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING, conditions: [] } as any;
      const previousExperiment = { id: 'experiment-1', assignmentAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM };
      const updatedExperiment = { id: 'experiment-1', assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING };
      const revertedExperiment = { id: 'experiment-1', assignmentAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM };
      const syncError = new Error('config sync failed');

      experimentService.getSingleExperiment.mockResolvedValue(previousExperiment);
      experimentService.update.mockResolvedValueOnce(updatedExperiment).mockResolvedValueOnce(revertedExperiment);
      adaptiveExperimentConfigDispatcher.syncConfigIfApplicable
        .mockRejectedValueOnce(syncError)
        .mockResolvedValueOnce(undefined);

      await expect(controller.update({ id: 'experiment-1' } as any, experiment, {} as any, request)).rejects.toThrow(
        syncError
      );

      // First update is the caller's requested change; second is the revert back to the pre-update state.
      expect(experimentService.update).toHaveBeenNthCalledWith(
        1,
        { ...experiment, id: 'experiment-1' },
        {},
        request.logger
      );
      expect(experimentService.update).toHaveBeenNthCalledWith(2, previousExperiment, {}, request.logger);
      // First sync is the caller's requested change (which failed); second cleans up against the reverted state.
      expect(adaptiveExperimentConfigDispatcher.syncConfigIfApplicable).toHaveBeenNthCalledWith(
        1,
        experiment,
        updatedExperiment
      );
      expect(adaptiveExperimentConfigDispatcher.syncConfigIfApplicable).toHaveBeenNthCalledWith(
        2,
        previousExperiment,
        revertedExperiment
      );
    });

    it('still throws the original error, logged rather than masked, when the revert attempt itself fails', async () => {
      const experiment = { assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING, conditions: [] } as any;
      const previousExperiment = { id: 'experiment-1', assignmentAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM };
      const syncError = new Error('config sync failed');
      const revertError = new Error('revert update failed');

      experimentService.getSingleExperiment.mockResolvedValue(previousExperiment);
      experimentService.update.mockResolvedValueOnce({ id: 'experiment-1' }).mockRejectedValueOnce(revertError);
      adaptiveExperimentConfigDispatcher.syncConfigIfApplicable.mockRejectedValue(syncError);

      await expect(controller.update({ id: 'experiment-1' } as any, experiment, {} as any, request)).rejects.toThrow(
        syncError
      );

      expect(request.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Failed to fully revert'), error: revertError })
      );
    });

    it('skips the revert (but still throws) when no previous experiment can be found', async () => {
      const experiment = { assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING, conditions: [] } as any;
      const syncError = new Error('config sync failed');

      experimentService.getSingleExperiment.mockResolvedValue(undefined);
      experimentService.update.mockResolvedValue({ id: 'experiment-1' });
      adaptiveExperimentConfigDispatcher.syncConfigIfApplicable.mockRejectedValue(syncError);

      await expect(controller.update({ id: 'experiment-1' } as any, experiment, {} as any, request)).rejects.toThrow(
        syncError
      );

      expect(experimentService.update).toHaveBeenCalledTimes(1);
    });
  });
});
