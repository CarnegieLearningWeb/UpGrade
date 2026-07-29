import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
    usedByCount: 1,
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

  it('should display the Used By column after Decision Point', () => {
    expect(component.displayedColumns).toEqual(['decisionPoint', 'usedBy', 'excludeIfReached', 'actions']);
  });

  it('should format singular, plural, and zero experiment counts', () => {
    const translate = TestBed.inject(TranslateService);
    jest
      .spyOn(translate, 'instant')
      .mockImplementation((translationKey: string, { count }: { count: number }) =>
        translationKey.endsWith('.one.text') ? `${count} Experiment` : `${count} Experiments`
      );

    expect(component.getUsedByCountText({ ...decisionPoint, usedByCount: 0 })).toBe('0 Experiments');
    expect(component.getUsedByCountText({ ...decisionPoint, usedByCount: 1 })).toBe('1 Experiment');
    expect(component.getUsedByCountText({ ...decisionPoint, usedByCount: 2 })).toBe('2 Experiments');
  });

  it('should leave the Used By cell blank until its count is loaded', () => {
    expect(component.getUsedByCountText({ ...decisionPoint, usedByCount: undefined })).toBe('');
  });

  it('should render the formatted usage count in the Used By cell', () => {
    const translate = TestBed.inject(TranslateService);
    const translateInstantSpy = jest
      .spyOn(translate, 'instant')
      .mockImplementation((_translationKey: string, { count }: { count: number }) => `${count} Experiment`);

    fixture.componentRef.setInput('decisionPoints', [{ ...decisionPoint }]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('td.used-by-column').textContent).toContain('1 Experiment');
    expect(translateInstantSpy).toHaveBeenCalledWith('experiments.details.decision-points.used-by-count.one.text', {
      count: 1,
    });
  });
});
