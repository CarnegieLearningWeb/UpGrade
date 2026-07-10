import type { Router } from '@angular/router';
import { EXPERIMENT_SEARCH_KEY } from 'upgrade_types';
import type { ExperimentDecisionPoint } from '../../../../../../../core/experiments/store/experiments.model';
import type { ExperimentService } from '../../../../../../../core/experiments/experiments.service';
import type { AuthService } from '../../../../../../../core/auth/auth.service';
import type { DialogService } from '../../../../../../../shared/services/common-dialog.service';
import type { DecisionPointHelperService } from '../../../../../../../core/experiments/decision-point-helper.service';

jest.mock(
  '@shared-component-lib',
  () => ({
    CommonSectionCardActionButtonsComponent: class CommonSectionCardActionButtonsComponent {},
    CommonSectionCardComponent: class CommonSectionCardComponent {},
    CommonSectionCardTitleHeaderComponent: class CommonSectionCardTitleHeaderComponent {},
  }),
  { virtual: true }
);

jest.mock('../../../../../../../shared/services/common-dialog.service', () => ({
  DialogService: class DialogService {},
}));

import { ExperimentDecisionPointsSectionCardComponent } from './experiment-decision-points-section-card.component';

describe('ExperimentDecisionPointsSectionCardComponent', () => {
  let component: ExperimentDecisionPointsSectionCardComponent;
  let experimentService: jest.Mocked<Pick<ExperimentService, 'setSearchKey' | 'setSearchString'>>;
  let router: jest.Mocked<Pick<Router, 'navigate'>>;

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

  beforeEach(() => {
    experimentService = {
      setSearchKey: jest.fn(),
      setSearchString: jest.fn(),
    };
    router = {
      navigate: jest.fn(),
    };

    component = new ExperimentDecisionPointsSectionCardComponent(
      experimentService as unknown as ExperimentService,
      {} as AuthService,
      {} as DialogService,
      {} as DecisionPointHelperService,
      router as unknown as Router
    );
  });

  it('should filter experiments by clicked decision point and navigate to the experiments root page', () => {
    component.onDecisionPointClick(decisionPoint);

    expect(experimentService.setSearchKey).toHaveBeenCalledWith(EXPERIMENT_SEARCH_KEY.DECISION_POINT);
    expect(experimentService.setSearchString).toHaveBeenCalledWith('lesson-stream (question-hint)');
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });
});
