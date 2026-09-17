import { ExperimentController } from '../../../src/api/controllers/ExperimentController';
import { ASSIGNMENT_ALGORITHM, EXPERIMENT_STATE } from 'upgrade_types';

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
      updateState: jest.fn(),
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
      const previousExperiment = { id: 'experiment-1', assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING };
      experimentService.getSingleExperiment.mockResolvedValue(previousExperiment);
      experimentService.update.mockResolvedValue({ id: 'experiment-1', conditions: [] });

      await controller.update({ id: 'experiment-1' } as any, experiment, {} as any, request);

      expect(experimentService.update).toHaveBeenCalledTimes(1);
      expect(adaptiveExperimentConfigDispatcher.syncConfigIfApplicable).toHaveBeenCalledTimes(1);
    });

    it('reverts the experiment and re-syncs the config when syncConfigIfApplicable fails', async () => {
      const experiment = { assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING, conditions: [] } as any;
      const previousExperiment = { id: 'experiment-1', assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING };
      const updatedExperiment = { id: 'experiment-1', assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING };
      const revertedExperiment = { id: 'experiment-1', assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING };
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

    it('snapshots thompsonSamplingConfig onto the previous experiment before the forward update runs, so a revert restores it', async () => {
      const experiment = { assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING, conditions: [] } as any;
      const previousExperiment = { id: 'experiment-1', assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING };
      const updatedExperiment = { id: 'experiment-1', assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING };
      const revertedExperiment = { id: 'experiment-1', assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING };
      const syncError = new Error('config sync failed');
      const originalConfig = { warmupThreshold: 42, batchSize: 3, minimumDrawDifference: 0.1, priors: {} };
      const callOrder: string[] = [];

      experimentService.getSingleExperiment.mockResolvedValue(previousExperiment);
      experimentService.update.mockImplementation(() => {
        callOrder.push('update');
        return Promise.resolve(
          callOrder.filter((c) => c === 'update').length === 1 ? updatedExperiment : revertedExperiment
        );
      });
      // Mimics attachConfigToExperiment()'s real behavior: mutate the passed-in object in place.
      // If this ran fresh inside the catch block instead of up front, it would see whatever a
      // partially-failed sync had already committed to the DB -- not the true pre-update values.
      adaptiveExperimentConfigDispatcher.attachConfigToExperiment.mockImplementation((exp: any) => {
        callOrder.push('attachConfig');
        exp.thompsonSamplingConfig = originalConfig;
        return Promise.resolve(exp);
      });
      adaptiveExperimentConfigDispatcher.syncConfigIfApplicable
        .mockRejectedValueOnce(syncError)
        .mockResolvedValueOnce(undefined);

      await expect(controller.update({ id: 'experiment-1' } as any, experiment, {} as any, request)).rejects.toThrow(
        syncError
      );

      expect(callOrder).toEqual(['attachConfig', 'update', 'update']);
      expect(adaptiveExperimentConfigDispatcher.syncConfigIfApplicable).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ thompsonSamplingConfig: originalConfig }),
        revertedExperiment
      );
    });

    it('still throws the original error, logged rather than masked, when the revert attempt itself fails', async () => {
      const experiment = { assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING, conditions: [] } as any;
      const previousExperiment = { id: 'experiment-1', assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING };
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

    it('rejects a condition field change once the experiment has started', async () => {
      const previousExperiment = {
        id: 'experiment-1',
        state: EXPERIMENT_STATE.RUNNING,
        conditions: [{ id: 'condition-1', conditionCode: 'A', name: 'A', description: '', assignmentWeight: 50 }],
      };
      const experiment = {
        id: 'experiment-1',
        conditions: [
          { id: 'condition-1', conditionCode: 'A-renamed', name: 'A', description: '', assignmentWeight: 50 },
        ],
      } as any;
      experimentService.getSingleExperiment.mockResolvedValue(previousExperiment);

      await expect(controller.update({ id: 'experiment-1' } as any, experiment, {} as any, request)).rejects.toThrow(
        /cannot be modified/
      );
      expect(experimentService.update).not.toHaveBeenCalled();
    });

    it('rejects an added/removed condition once the experiment has started', async () => {
      const previousExperiment = {
        id: 'experiment-1',
        state: EXPERIMENT_STATE.PAUSED,
        conditions: [{ id: 'condition-1', conditionCode: 'A', assignmentWeight: 100 }],
      };
      const experiment = {
        id: 'experiment-1',
        conditions: [
          { id: 'condition-1', conditionCode: 'A', assignmentWeight: 50 },
          { id: 'condition-2', conditionCode: 'B', assignmentWeight: 50 },
        ],
      } as any;
      experimentService.getSingleExperiment.mockResolvedValue(previousExperiment);

      await expect(controller.update({ id: 'experiment-1' } as any, experiment, {} as any, request)).rejects.toThrow(
        /cannot be modified/
      );
      expect(experimentService.update).not.toHaveBeenCalled();
    });

    it('rejects a Thompson Sampling prior change once the experiment has started', async () => {
      const previousExperiment = {
        id: 'experiment-1',
        state: EXPERIMENT_STATE.RUNNING,
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING,
        conditions: [{ id: 'condition-1', conditionCode: 'A' }],
        thompsonSamplingConfig: { priors: { 'condition-1': { success: 1, failure: 1 } } },
      };
      const experiment = {
        id: 'experiment-1',
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING,
        conditions: [{ id: 'condition-1', conditionCode: 'A' }],
        thompsonSamplingConfig: { priors: { 'condition-1': { success: 5, failure: 1 } } },
      } as any;
      experimentService.getSingleExperiment.mockResolvedValue(previousExperiment);

      await expect(controller.update({ id: 'experiment-1' } as any, experiment, {} as any, request)).rejects.toThrow(
        /cannot be modified/
      );
      expect(experimentService.update).not.toHaveBeenCalled();
    });

    it('allows an unrelated field change once the experiment has started, when conditions/priors are unchanged', async () => {
      const previousExperiment = {
        id: 'experiment-1',
        state: EXPERIMENT_STATE.RUNNING,
        name: 'old name',
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING,
        conditions: [{ id: 'condition-1', conditionCode: 'A', assignmentWeight: 100 }],
        thompsonSamplingConfig: { priors: { 'condition-1': { success: 1, failure: 1 } } },
      };
      const experiment = {
        id: 'experiment-1',
        name: 'new name',
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING,
        conditions: [{ id: 'condition-1', conditionCode: 'A', assignmentWeight: 100 }],
        thompsonSamplingConfig: { priors: { 'condition-1': { success: 1, failure: 1 } } },
      } as any;
      experimentService.getSingleExperiment.mockResolvedValue(previousExperiment);
      experimentService.update.mockResolvedValue({ id: 'experiment-1', conditions: experiment.conditions });

      await controller.update({ id: 'experiment-1' } as any, experiment, {} as any, request);

      expect(experimentService.update).toHaveBeenCalledTimes(1);
    });

    it('rejects switching the assignment algorithm from Thompson Sampling to something else, even on an inactive experiment', async () => {
      const previousExperiment = {
        id: 'experiment-1',
        state: EXPERIMENT_STATE.INACTIVE,
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING,
        conditions: [],
      };
      const experiment = {
        id: 'experiment-1',
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM,
        conditions: [],
      } as any;
      experimentService.getSingleExperiment.mockResolvedValue(previousExperiment);

      await expect(controller.update({ id: 'experiment-1' } as any, experiment, {} as any, request)).rejects.toThrow(
        /cannot be changed to or from Thompson Sampling/
      );
      expect(experimentService.update).not.toHaveBeenCalled();
    });

    it('rejects switching the assignment algorithm to Thompson Sampling from something else, even on an inactive experiment', async () => {
      const previousExperiment = {
        id: 'experiment-1',
        state: EXPERIMENT_STATE.INACTIVE,
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM,
        conditions: [],
      };
      const experiment = {
        id: 'experiment-1',
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING,
        conditions: [],
      } as any;
      experimentService.getSingleExperiment.mockResolvedValue(previousExperiment);

      await expect(controller.update({ id: 'experiment-1' } as any, experiment, {} as any, request)).rejects.toThrow(
        /cannot be changed to or from Thompson Sampling/
      );
      expect(experimentService.update).not.toHaveBeenCalled();
    });

    it('allows switching between two non-Thompson-Sampling algorithms', async () => {
      const previousExperiment = {
        id: 'experiment-1',
        state: EXPERIMENT_STATE.INACTIVE,
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.RANDOM,
        conditions: [],
      };
      const experiment = {
        id: 'experiment-1',
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.STRATIFIED_RANDOM_SAMPLING,
        conditions: [],
      } as any;
      experimentService.getSingleExperiment.mockResolvedValue(previousExperiment);
      experimentService.update.mockResolvedValue({ id: 'experiment-1', conditions: [] });

      await controller.update({ id: 'experiment-1' } as any, experiment, {} as any, request);

      expect(experimentService.update).toHaveBeenCalledTimes(1);
    });

    it('allows a condition/prior change while the experiment has not started yet', async () => {
      const previousExperiment = {
        id: 'experiment-1',
        state: EXPERIMENT_STATE.INACTIVE,
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING,
        conditions: [{ id: 'condition-1', conditionCode: 'A' }],
        thompsonSamplingConfig: { priors: { 'condition-1': { success: 1, failure: 1 } } },
      };
      const experiment = {
        id: 'experiment-1',
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING,
        conditions: [{ id: 'condition-1', conditionCode: 'A-renamed' }],
        thompsonSamplingConfig: { priors: { 'condition-1': { success: 5, failure: 1 } } },
      } as any;
      experimentService.getSingleExperiment.mockResolvedValue(previousExperiment);
      experimentService.update.mockResolvedValue({ id: 'experiment-1', conditions: experiment.conditions });

      await controller.update({ id: 'experiment-1' } as any, experiment, {} as any, request);

      expect(experimentService.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateState()', () => {
    it('attaches the Thompson Sampling config onto the state-change response, like the other endpoints', async () => {
      const updatedExperiment = {
        id: 'experiment-1',
        state: EXPERIMENT_STATE.PAUSED,
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.THOMPSON_SAMPLING,
      };
      experimentService.updateState.mockResolvedValue(updatedExperiment);

      const stateUpdate = { experimentId: 'experiment-1', state: EXPERIMENT_STATE.PAUSED } as any;
      const result = await controller.updateState(stateUpdate, {} as any, request);

      expect(adaptiveExperimentConfigDispatcher.attachConfigToExperiment).toHaveBeenCalledWith(updatedExperiment);
      expect(result).toBe(updatedExperiment);
    });
  });
});
