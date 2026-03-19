import { TestBed } from '@angular/core/testing';
import { MetricHelperService } from './metric-helper.service';
import { ExperimentService } from './experiments.service';
import { ExperimentQueryDTO } from './store/experiments.model';
import { OPERATION_TYPES, REPEATED_MEASURE } from 'upgrade_types';

jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

describe('MetricHelperService', () => {
  let service: MetricHelperService;
  let mockExperimentService: any;

  beforeEach(() => {
    mockExperimentService = {
      updateExperimentMetrics: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [MetricHelperService, { provide: ExperimentService, useValue: mockExperimentService }],
    });

    service = TestBed.inject(MetricHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('addMetric', () => {
    it('should append the new metric to the existing list', () => {
      const experiment = createExperiment([createQuery('q1', 1), createQuery('q2', 2)]);
      const newMetricData = createQuery('q3', undefined);

      service.addMetric(experiment, newMetricData);

      const { metrics } = getLastUpdateCall();
      expect(metrics.length).toBe(3);
      expect(metrics[2].name).toBe('q3');
    });

    it('should assign a new uuid id to the added metric', () => {
      const experiment = createExperiment([]);
      const newMetricData = createQuery('q1', undefined);

      service.addMetric(experiment, newMetricData);

      const { metrics } = getLastUpdateCall();
      expect(metrics[0].id).toBe('mock-uuid');
    });

    it('should NOT set an order property on the new metric (backend assigns order)', () => {
      const experiment = createExperiment([createQuery('q1', 1), createQuery('q2', 2)]);
      const newMetricData = createQuery('q3', undefined);

      service.addMetric(experiment, newMetricData);

      const { metrics } = getLastUpdateCall();
      expect(metrics[2].order).toBeUndefined();
    });

    it('should handle adding to an experiment with no existing queries', () => {
      const experiment = createExperiment([]);
      const newMetricData = createQuery('q1', undefined);

      service.addMetric(experiment, newMetricData);

      const { metrics } = getLastUpdateCall();
      expect(metrics.length).toBe(1);
      expect(metrics[0].name).toBe('q1');
    });

    it('should handle adding to an experiment with undefined queries', () => {
      const experiment = { ...createExperiment([]), queries: undefined };
      const newMetricData = createQuery('q1', undefined);

      service.addMetric(experiment, newMetricData);

      const { metrics } = getLastUpdateCall();
      expect(metrics.length).toBe(1);
    });

    it('should preserve existing metrics unchanged', () => {
      const q1 = createQuery('q1', 1);
      const experiment = createExperiment([q1]);
      const newMetricData = createQuery('q2', undefined);

      service.addMetric(experiment, newMetricData);

      const { metrics } = getLastUpdateCall();
      expect(metrics[0].name).toBe('q1');
      expect(metrics[0].order).toBe(1);
    });

    it('should call updateExperimentMetrics with the experiment', () => {
      const experiment = createExperiment([]);

      service.addMetric(experiment, createQuery('q1', undefined));

      const { experiment: passedExperiment } = getLastUpdateCall();
      expect(passedExperiment).toBe(experiment);
    });
  });

  describe('updateMetric', () => {
    it('should update the matching metric in place', () => {
      const q1 = createQuery('q1', 1);
      const q2 = createQuery('q2', 2);
      const experiment = createExperiment([q1, q2]);
      const updatedData: ExperimentQueryDTO = { ...q1, name: 'q1-updated' };

      service.updateMetric(experiment, q1, updatedData);

      const { metrics } = getLastUpdateCall();
      expect(metrics[0].name).toBe('q1-updated');
      expect(metrics[1].name).toBe('q2');
    });

    it('should preserve unrelated metrics unchanged', () => {
      const q1 = createQuery('q1', 1);
      const q2 = createQuery('q2', 2);
      const q3 = createQuery('q3', 3);
      const experiment = createExperiment([q1, q2, q3]);

      service.updateMetric(experiment, q2, { ...q2, name: 'q2-updated' });

      const { metrics } = getLastUpdateCall();
      expect(metrics[0].name).toBe('q1');
      expect(metrics[2].name).toBe('q3');
    });

    it('should call updateExperimentMetrics', () => {
      const q1 = createQuery('q1', 1);
      const experiment = createExperiment([q1]);

      service.updateMetric(experiment, q1, { ...q1, name: 'updated' });

      expect(mockExperimentService.updateExperimentMetrics).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteMetric', () => {
    it('should remove the specified metric from the list', () => {
      const q1 = createQuery('q1', 1);
      const q2 = createQuery('q2', 2);
      const q3 = createQuery('q3', 3);
      const experiment = createExperiment([q1, q2, q3]);

      service.deleteMetric(experiment, q2);

      const { metrics } = getLastUpdateCall();
      expect(metrics.length).toBe(2);
      expect(metrics.find((m) => m.id === 'q2')).toBeUndefined();
    });

    it('should NOT re-index order values (backend handles re-indexing on save)', () => {
      const q1 = createQuery('q1', 1);
      const q2 = createQuery('q2', 2);
      const q3 = createQuery('q3', 3);
      const experiment = createExperiment([q1, q2, q3]);

      service.deleteMetric(experiment, q1);

      const { metrics } = getLastUpdateCall();
      // Remaining metrics keep their original order values — backend will re-assign on save
      expect(metrics[0].order).toBe(2);
      expect(metrics[1].order).toBe(3);
    });

    it('should handle deleting the only metric', () => {
      const q1 = createQuery('q1', 1);
      const experiment = createExperiment([q1]);

      service.deleteMetric(experiment, q1);

      const { metrics } = getLastUpdateCall();
      expect(metrics.length).toBe(0);
    });

    it('should preserve remaining metrics in original relative order', () => {
      const q1 = createQuery('q1', 1);
      const q2 = createQuery('q2', 2);
      const q3 = createQuery('q3', 3);
      const q4 = createQuery('q4', 4);
      const experiment = createExperiment([q1, q2, q3, q4]);

      service.deleteMetric(experiment, q1);

      const { metrics } = getLastUpdateCall();
      expect(metrics[0].name).toBe('q2');
      expect(metrics[1].name).toBe('q3');
      expect(metrics[2].name).toBe('q4');
    });

    it('should call updateExperimentMetrics with the experiment', () => {
      const q1 = createQuery('q1', 1);
      const experiment = createExperiment([q1]);

      service.deleteMetric(experiment, q1);

      const { experiment: passedExperiment } = getLastUpdateCall();
      expect(passedExperiment).toBe(experiment);
    });
  });

  // --- helpers ---

  function getLastUpdateCall(): { experiment: any; metrics: ExperimentQueryDTO[] } {
    const call = mockExperimentService.updateExperimentMetrics.mock.lastCall[0];
    return { experiment: call.experiment, metrics: call.metrics };
  }
});

function createQuery(name: string, order: number | undefined): ExperimentQueryDTO {
  return {
    id: name,
    name,
    query: { operationType: OPERATION_TYPES.AVERAGE },
    metric: { key: `metric-${name}` },
    repeatedMeasure: REPEATED_MEASURE.mostRecent,
    order,
  };
}

function createExperiment(queries: ExperimentQueryDTO[]): any {
  return {
    id: 'exp-1',
    name: 'Test Experiment',
    queries,
  };
}
