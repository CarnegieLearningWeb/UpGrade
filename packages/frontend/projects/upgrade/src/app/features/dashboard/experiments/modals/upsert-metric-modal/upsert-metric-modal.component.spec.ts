import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { UpsertMetricModalComponent } from './upsert-metric-modal.component';
import {
  Experiment,
  ExperimentQueryDTO,
  MetricFormData,
  UpsertMetricParams,
  UPSERT_EXPERIMENT_ACTION,
} from '../../../../../core/experiments/store/experiments.model';
import { METRICS_JOIN_TEXT } from '../../../../../core/analysis/store/analysis.models';
import {
  ExperimentQueryComparator,
  IMetricMetaData,
  IMetricUnit,
  METRIC_TYPE,
  OPERATION_TYPES,
  REPEATED_MEASURE,
} from 'upgrade_types';
import { CommonModalConfig } from '@shared-component-lib/common-modal/common-modal.types';
import { AnalysisService } from '../../../../../core/analysis/analysis.service';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { MetricHelperService } from '../../../../../core/experiments/metric-helper.service';
import { NotificationService } from '../../../../../core/notifications/notification.service';

describe('UpsertMetricModalComponent', () => {
  let fixture: ComponentFixture<UpsertMetricModalComponent>;
  let component: UpsertMetricModalComponent;
  let analysisMetrics$: BehaviorSubject<IMetricUnit[]>;
  let experimentServiceStub: Partial<ExperimentService>;
  let metricHelperServiceStub: MetricHelperService;
  let notificationServiceStub: NotificationService;

  const defaultConfig: CommonModalConfig<UpsertMetricParams> = {
    title: 'Upsert Metric',
    params: {
      action: UPSERT_EXPERIMENT_ACTION.ADD,
      experimentId: 'experiment-001',
      sourceQuery: null,
    },
  };

  const dialogRefStub = {
    close: jest.fn(),
  } as unknown as MatDialogRef<UpsertMetricModalComponent>;

  const createComponent = (configOverride?: Partial<CommonModalConfig<UpsertMetricParams>>) => {
    const mergedParams = configOverride?.params
      ? { ...defaultConfig.params, ...configOverride.params }
      : { ...defaultConfig.params };

    const mergedConfig: CommonModalConfig<UpsertMetricParams> = {
      ...defaultConfig,
      ...configOverride,
      params: mergedParams,
    };

    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: mergedConfig });

    fixture = TestBed.createComponent(UpsertMetricModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    return component;
  };

  beforeEach(async () => {
    analysisMetrics$ = new BehaviorSubject<IMetricUnit[]>([]);

    experimentServiceStub = {
      isLoadingExperiment$: of(false),
      selectedExperiment$: new BehaviorSubject<Experiment | null>(null),
      experiments$: new BehaviorSubject<Experiment[]>([]),
      updateExperimentMetrics: jest.fn(),
      updateExperiment: jest.fn(),
    };

    metricHelperServiceStub = {
      addMetric: jest.fn(),
      updateMetric: jest.fn(),
    } as unknown as MetricHelperService;

    notificationServiceStub = {
      showError: jest.fn(),
    } as unknown as NotificationService;

    await TestBed.configureTestingModule({
      imports: [UpsertMetricModalComponent, ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: MAT_DIALOG_DATA, useValue: defaultConfig },
        { provide: MatDialogRef, useValue: dialogRefStub },
        { provide: AnalysisService, useValue: { allMetrics$: analysisMetrics$ } },
        { provide: ExperimentService, useValue: experimentServiceStub },
        { provide: MetricHelperService, useValue: metricHelperServiceStub },
        { provide: NotificationService, useValue: notificationServiceStub },
      ],
    })
      .overrideComponent(UpsertMetricModalComponent, {
        set: { template: '' },
      })
      .compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should initialize global metric defaults when adding a new metric', () => {
    createComponent();

    expect(component.metricForm.get('metricType')?.value).toBe(METRIC_TYPE.GLOBAL);
    expect(component.metricForm.get('displayName')?.value).toBe('');
    expect(component.metricForm.get('comparison')?.value).toBe('=');
    expect(component.metricForm.get('compareValue')?.value).toBe('');
    expect(component.showAggregateStatistic).toBe(false);
    expect(component.showComparison).toBe(false);
  });

  it('should populate repeatable metric data when editing an existing query', () => {
    const repeatableMetricTree: IMetricUnit = {
      key: 'orders',
      children: [
        {
          key: 'status',
          children: [
            {
              key: 'completed',
              metadata: { type: IMetricMetaData.CATEGORICAL },
              allowedData: ['GRADUATED', 'DROPPED'],
            },
          ],
          metadata: { type: IMetricMetaData.CATEGORICAL },
        },
      ],
      metadata: { type: IMetricMetaData.CATEGORICAL },
    };

    analysisMetrics$.next([repeatableMetricTree]);

    const sourceQuery: ExperimentQueryDTO = {
      id: 'query-123',
      name: 'Completion Rate',
      metric: {
        key: `orders${METRICS_JOIN_TEXT}status${METRICS_JOIN_TEXT}completed`,
      },
      query: {
        operationType: OPERATION_TYPES.COUNT,
        compareFn: '=',
        compareValue: 'GRADUATED',
      },
      repeatedMeasure: REPEATED_MEASURE.mostRecent,
    };

    createComponent({
      params: {
        action: UPSERT_EXPERIMENT_ACTION.EDIT,
        experimentId: 'experiment-001',
        sourceQuery,
        currentContext: 'mathia',
      },
    });

    expect(component.metricForm.get('metricType')?.value).toBe(METRIC_TYPE.REPEATABLE);

    const metricClassControl = component.metricForm.get('metricClass')?.value as IMetricUnit;
    expect(metricClassControl?.key).toBe('orders');

    expect(component.metricForm.get('aggregateStatistic')?.value).toBe(OPERATION_TYPES.COUNT);
    expect(component.metricForm.get('comparison')?.value as ExperimentQueryComparator).toBe('=');
    expect(component.metricForm.get('compareValue')?.value).toBe('GRADUATED');
    expect(component.showAggregateStatistic).toBe(true);
    expect(component.showComparison).toBe(true);
  });

  it('should build a categorical repeatable metric payload for the backend', () => {
    createComponent();

    component.metricDataType = IMetricMetaData.CATEGORICAL;

    const repeatableFormValue = {
      metricType: METRIC_TYPE.REPEATABLE,
      metricId: 'completed',
      displayName: 'Completion Rate',
      metricClass: 'orders',
      metricKey: 'status',
      aggregateStatistic: OPERATION_TYPES.COUNT,
      individualStatistic: REPEATED_MEASURE.mean,
      comparison: '=',
      compareValue: 'GRADUATED',
    } as MetricFormData & {
      metricType: METRIC_TYPE.REPEATABLE;
      aggregateStatistic: OPERATION_TYPES;
      comparison: ExperimentQueryComparator;
    };

    const dto = (component as any).prepareMetricDataForBackend(repeatableFormValue);

    expect(dto.name).toBe('Completion Rate');
    expect(dto.metric.key).toBe(`orders${METRICS_JOIN_TEXT}status${METRICS_JOIN_TEXT}completed`);
    expect(dto.query.operationType).toBe(OPERATION_TYPES.COUNT);
    expect(dto.query.compareFn).toBe('=');
    expect(dto.query.compareValue).toBe('GRADUATED');
    expect(dto.repeatedMeasure).toBe(REPEATED_MEASURE.mean);
  });
});
