import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { ExperimentDecisionPointsTableComponent } from './experiment-decision-points-table.component';
import type { ExperimentDecisionPoint } from '../../../../../../../../core/experiments/store/experiments.model';

describe('ExperimentDecisionPointsTableComponent', () => {
  let component: ExperimentDecisionPointsTableComponent;
  let fixture: ComponentFixture<ExperimentDecisionPointsTableComponent>;

  const decisionPoint = {
    id: 'decision-point-1',
    site: 'lesson-stream',
    target: 'question-hint',
    description: '',
    order: 1,
    createdAt: '',
    updatedAt: '',
    versionNumber: 1,
    excludeIfReached: false,
  } as ExperimentDecisionPoint;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExperimentDecisionPointsTableComponent, NoopAnimationsModule, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(ExperimentDecisionPointsTableComponent);
    component = fixture.componentInstance;
    component.decisionPoints = [decisionPoint];
    component.isLoading$ = of(false);
    fixture.detectChanges();
  });

  it('should emit the clicked decision point when the decision point text is clicked', () => {
    const emitSpy = jest.spyOn(component.decisionPointClick, 'emit');
    const decisionPointButton: HTMLButtonElement = fixture.nativeElement.querySelector('.decision-point-link');

    decisionPointButton.click();

    expect(emitSpy).toHaveBeenCalledWith(decisionPoint);
  });

  it('should format decision points using the shared display format', () => {
    expect(component.getDecisionPoint(decisionPoint)).toBe('lesson-stream (question-hint)');
  });
});
