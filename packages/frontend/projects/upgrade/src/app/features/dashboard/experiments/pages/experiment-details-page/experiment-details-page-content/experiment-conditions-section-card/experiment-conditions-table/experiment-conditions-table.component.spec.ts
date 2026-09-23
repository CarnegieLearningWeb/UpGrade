import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltip } from '@angular/material/tooltip';
import { of } from 'rxjs';
import { ExperimentConditionsTableComponent } from './experiment-conditions-table.component';
import type { ExperimentCondition } from '../../../../../../../../core/experiments/store/experiments.model';

describe('ExperimentConditionsTableComponent', () => {
  let component: ExperimentConditionsTableComponent;
  let fixture: ComponentFixture<ExperimentConditionsTableComponent>;

  const condition = {
    id: 'condition-1',
    name: 'potential-condition-1',
    description: '',
    conditionCode: 'potential-condition-1',
    assignmentWeight: 50,
    order: 1,
    createdAt: '',
    updatedAt: '',
    versionNumber: 1,
  } as ExperimentCondition;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExperimentConditionsTableComponent, NoopAnimationsModule, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(ExperimentConditionsTableComponent);
    component = fixture.componentInstance;
    component.conditions = [condition];
    component.isLoading$ = of(false);
  });

  it('should show the weight column (not prior columns) for non-mooclet experiments', () => {
    component.isMoocletExperiment = false;
    fixture.detectChanges();

    expect(component.displayedColumns).toEqual(['condition', 'weight', 'weightEdit', 'description', 'actions']);
  });

  it('should show prior success/failure columns instead of weight for mooclet experiments', () => {
    component.isMoocletExperiment = true;
    fixture.detectChanges();

    expect(component.displayedColumns).toEqual([
      'condition',
      'priorSuccesses',
      'priorFailures',
      'priorEdit',
      'description',
      'actions',
    ]);
  });

  it('should show a tooltip on the prior success/failure headers explaining they replace static weights', () => {
    component.isMoocletExperiment = true;
    fixture.detectChanges();

    const priorHeaderTooltips = fixture.debugElement
      .queryAll(By.css('th.prior-column'))
      .map((debugEl) => debugEl.injector.get(MatTooltip));

    expect(priorHeaderTooltips).toHaveLength(2);
    priorHeaderTooltips.forEach((tooltip) => {
      expect(tooltip.message).toBe('experiments.details.conditions.prior-adaptive-tooltip.text');
    });
  });
});
