import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
  CommonSectionCardOverviewDetailsComponent,
} from '@shared-component-lib';
import { ActionButton } from '@shared-component-lib/common-section-card-action-buttons/common-section-card-action-buttons.component';
import { CommonTabbedSectionCardFooterComponent } from '@shared-component-lib/common-tabbed-section-card-footer/common-tabbed-section-card-footer.component';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IMenuButtonItem, EXPERIMENT_SEARCH_KEY } from 'upgrade_types';
import { ExperimentService } from '../../../../../../../core/experiments/experiments.service';
import { combineLatest, map, Observable, Subscription, take } from 'rxjs';
import {
  Experiment,
  EXPERIMENT_OVERVIEW_LABELS,
  EXPERIMENT_STATE,
  ExperimentStateInfo,
  EXPERIMENT_ACTION_BUTTON_TYPE,
  POST_EXPERIMENT_RULE,
  PAUSE_BEHAVIOR_MODAL_MODE,
  EXPERIMENT_DETAILS_PAGE_ACTIONS,
  ExperimentStateTimeLog,
} from '../../../../../../../core/experiments/store/experiments.model';
import { Router } from '@angular/router';
import { DialogService } from '../../../../../../../shared/services/common-dialog.service';
import { UserPermission } from '../../../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../../../core/auth/auth.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonExportHelpersService } from '../../../../../../../shared/services/common-export-helpers.service';

@Component({
  selector: 'app-experiment-overview-details-section-card',
  imports: [
    CommonModule,
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    CommonSectionCardOverviewDetailsComponent,
    CommonTabbedSectionCardFooterComponent,
    TranslateModule,
    MatTooltipModule,
  ],
  templateUrl: './experiment-overview-details-section-card.component.html',
  styleUrl: './experiment-overview-details-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentOverviewDetailsSectionCardComponent implements OnInit, OnDestroy {
  @Input() isSectionCardExpanded = true;
  @Output() sectionCardExpandChange = new EventEmitter<boolean>();
  @Output() tabChange = new EventEmitter<number>();
  permissions$: Observable<UserPermission> = this.authService.userPermissions$;
  experiment$: Observable<Experiment> = this.experimentService.selectedExperiment$;
  experimentOverviewDetails$ = this.experimentService.selectedExperimentOverviewDetails$;
  warningKeysForSelectedExperiment$ = this.experimentService.warningKeysForSelectedExperiment$;
  experimentMenuItems$ = this.experimentService.experimentMenuItems$;
  menuButtonItems$: Observable<IMenuButtonItem[]>;
  subscriptions = new Subscription();
  emailId = '';
  bullettedListKeys = [EXPERIMENT_OVERVIEW_LABELS.ADAPTIVE_ALGORITHM_PARAMETERS];
  tabLabels = [
    { label: 'Design', disabled: false },
    { label: 'Data', disabled: false },
    { label: 'Logs', disabled: false },
  ];

  // Action buttons - maps ExperimentActionButton[] to ActionButton[]
  // Only shown when user has update permission
  actionButtons$: Observable<ActionButton[]> = combineLatest([
    this.experimentService.experimentActionButtons$,
    this.permissions$,
  ]).pipe(
    map(([buttons, permissions]) => {
      if (!permissions?.experiments.update) {
        return [];
      }
      return buttons.map((button) => ({
        action: button.action,
        icon: button.icon,
        disabled: button.disabled,
        tooltip: button.disabledReasons ? this.formatTooltip(button.disabledReasons) : undefined,
        tooltipClass: button.disabledReasons ? 'multiline-tooltip' : undefined,
        translationKey: button.translationKey,
        colorClass: `button-${button.action}`, // Maps to CSS classes: button-start, button-pause, etc.
      }));
    })
  );

  constructor(
    private readonly experimentService: ExperimentService,
    private readonly dialogService: DialogService,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly translate: TranslateService,
    private readonly commonExportHelpersService: CommonExportHelpersService
  ) {}

  filterExperimentByChips(tagValue: string) {
    this.experimentService.setSearchKey(EXPERIMENT_SEARCH_KEY.TAG);
    this.experimentService.setSearchString(tagValue);
    this.router.navigate(['/experiments']);
  }
  ngOnInit(): void {
    this.subscriptions.add(this.experimentService.currentUserEmailAddress$.subscribe((id) => (this.emailId = id)));
    this.menuButtonItems$ = combineLatest([this.experimentMenuItems$, this.permissions$]).pipe(
      map(([menuItems, permissions]) => [
        {
          label: 'experiments.details.edit-experiment.menu-item.text',
          action: EXPERIMENT_DETAILS_PAGE_ACTIONS.EDIT,
          disabled:
            !permissions?.experiments.update ||
            menuItems.find((item) => item.action === EXPERIMENT_DETAILS_PAGE_ACTIONS.EDIT)?.disabled,
        },
        {
          label: 'experiments.details.duplicate-experiment.menu-item.text',
          action: EXPERIMENT_DETAILS_PAGE_ACTIONS.DUPLICATE,
          disabled:
            !permissions?.experiments.create ||
            menuItems.find((item) => item.action === EXPERIMENT_DETAILS_PAGE_ACTIONS.DUPLICATE)?.disabled,
        },
        {
          label: 'experiments.details.export-experiment-design.menu-item.text',
          action: EXPERIMENT_DETAILS_PAGE_ACTIONS.EXPORT_DESIGN,
          disabled: menuItems.find((item) => item.action === EXPERIMENT_DETAILS_PAGE_ACTIONS.EXPORT_DESIGN)?.disabled,
        },
        {
          label: 'experiments.details.email-experiment-data.menu-item.text',
          action: EXPERIMENT_DETAILS_PAGE_ACTIONS.EMAIL_DATA,
          disabled:
            !permissions?.experiments.update ||
            menuItems.find((item) => item.action === EXPERIMENT_DETAILS_PAGE_ACTIONS.EMAIL_DATA)?.disabled,
        },
        {
          label: 'experiments.details.archive-experiment.menu-item.text',
          action: EXPERIMENT_DETAILS_PAGE_ACTIONS.ARCHIVE,
          disabled:
            !permissions?.experiments.update ||
            menuItems.find((item) => item.action === EXPERIMENT_DETAILS_PAGE_ACTIONS.ARCHIVE)?.disabled,
        },
        {
          label: 'experiments.details.delete-experiment.menu-item.text',
          action: EXPERIMENT_DETAILS_PAGE_ACTIONS.DELETE,
          disabled:
            !permissions?.experiments.delete ||
            menuItems.find((item) => item.action === EXPERIMENT_DETAILS_PAGE_ACTIONS.DELETE)?.disabled,
        },
        {
          label: 'experiments.details.export-state-change-logs.menu-item.text',
          action: EXPERIMENT_DETAILS_PAGE_ACTIONS.EXPORT_STATE_CHANGE_LOGS,
          disabled: menuItems.find((item) => item.action === EXPERIMENT_DETAILS_PAGE_ACTIONS.EXPORT_STATE_CHANGE_LOGS)
            ?.disabled,
        },
      ])
    );
  }

  onSectionCardExpandChange(expanded: boolean): void {
    this.isSectionCardExpanded = expanded;
    this.sectionCardExpandChange.emit(expanded);
  }

  onSelectedTabChange(tabIndex: number): void {
    this.tabChange.emit(tabIndex);
  }

  onMenuButtonItemClick(action: EXPERIMENT_DETAILS_PAGE_ACTIONS, experiment: Experiment): void {
    switch (action) {
      case EXPERIMENT_DETAILS_PAGE_ACTIONS.DELETE:
        this.subscriptions.add(
          this.dialogService
            .openDeleteExperimentModal(experiment.name, this.experimentService.isLoadingExperimentDelete$)
            .afterClosed()
            .subscribe((confirmed: boolean) => {
              if (confirmed) {
                this.experimentService.deleteExperiment(experiment.id);
              }
            })
        );
        break;
      case EXPERIMENT_DETAILS_PAGE_ACTIONS.EDIT:
        this.dialogService.openEditExperimentModal(experiment);
        break;
      case EXPERIMENT_DETAILS_PAGE_ACTIONS.DUPLICATE:
        this.dialogService.openDuplicateExperimentModal(experiment);
        break;
      case EXPERIMENT_DETAILS_PAGE_ACTIONS.ARCHIVE:
        this.openConfirmArchiveModal(experiment.id, experiment.name);
        break;
      case EXPERIMENT_DETAILS_PAGE_ACTIONS.EXPORT_DESIGN:
        this.openConfirmExportDesignModal(experiment.id);
        break;
      case EXPERIMENT_DETAILS_PAGE_ACTIONS.EMAIL_DATA:
        this.openConfirmEmailDataModal(experiment.id, experiment.name);
        break;
      case EXPERIMENT_DETAILS_PAGE_ACTIONS.EXPORT_STATE_CHANGE_LOGS:
        this.downloadStateChangeLogs(experiment.name, experiment.stateTimeLogs || []);
        break;
      default:
        console.log('Unknown action');
    }
  }

  openConfirmExportDesignModal(id: string) {
    this.subscriptions.add(
      this.dialogService
        .openExportExperimentDesignModal()
        .afterClosed()
        .subscribe((isExportClicked: boolean) => {
          if (isExportClicked) {
            this.experimentService.exportExperimentDesign([id]);
          }
        })
    );
  }

  downloadStateChangeLogs(name: string, stateTimeLogs: ExperimentStateTimeLog[]) {
    if (!stateTimeLogs.length) return;

    const headerRow = 'timeLog,fromState,toState';
    const sortedLogs = [...stateTimeLogs].sort((a, b) => new Date(a.timeLog).getTime() - new Date(b.timeLog).getTime());
    const dataRows = sortedLogs.map(({ timeLog, fromState, toState }) => {
      const formattedTime = new Date(timeLog).toLocaleString();
      return `"${formattedTime}","${fromState}","${toState}"`;
    });
    const csvRows = [headerRow, ...dataRows];

    this.commonExportHelpersService.downloadValuesAsCSV(
      csvRows,
      `${name}_state_change_logs_${new Date().toISOString()}`
    );
  }

  openConfirmArchiveModal(id: string, name: string) {
    this.subscriptions.add(
      this.dialogService
        .openArchiveExperimentModal(name)
        .afterClosed()
        .subscribe((confirmed: boolean) => {
          if (confirmed) {
            const experimentStateInfo: ExperimentStateInfo = {
              newStatus: EXPERIMENT_STATE.ARCHIVED,
            };
            this.experimentService.updateExperimentState(id, experimentStateInfo);
          }
        })
    );
  }

  openConfirmEmailDataModal(id: string, name: string) {
    const confirmMessage = 'experiments.export-experiment-data.confirmation-text.text';
    const emailConfirmationMessage = `The experiment data will be sent to '${this.emailId}'.`;
    this.subscriptions.add(
      this.dialogService
        .openEmailExperimentDataModal(confirmMessage, emailConfirmationMessage)
        .afterClosed()
        .subscribe((isExportClicked: boolean) => {
          if (isExportClicked) {
            this.experimentService.exportExperimentInfo(id, name);
          }
        })
    );
  }

  onActionButtonClick(action: EXPERIMENT_ACTION_BUTTON_TYPE): void {
    this.subscriptions.add(
      this.experiment$.pipe(take(1)).subscribe((experiment) => {
        if (!experiment) return;

        switch (action) {
          case EXPERIMENT_ACTION_BUTTON_TYPE.START:
            this.handleStartExperiment(experiment);
            break;
          case EXPERIMENT_ACTION_BUTTON_TYPE.PAUSE:
            this.handlePauseExperiment(experiment);
            break;
          case EXPERIMENT_ACTION_BUTTON_TYPE.STOP:
            this.handleStopExperiment(experiment);
            break;
          case EXPERIMENT_ACTION_BUTTON_TYPE.RESUME:
            this.handleResumeExperiment(experiment);
            break;
        }
      })
    );
  }

  private handleStartExperiment(experiment: Experiment): void {
    this.subscriptions.add(
      this.dialogService
        .openStartExperimentModal(experiment.name)
        .afterClosed()
        .subscribe((confirmed: boolean) => {
          if (confirmed) {
            const experimentStateInfo: ExperimentStateInfo = {
              newStatus: EXPERIMENT_STATE.RUNNING,
            };
            this.experimentService.updateExperimentState(experiment.id, experimentStateInfo);
          }
        })
    );
  }

  private handlePauseExperiment(experiment: Experiment): void {
    this.subscriptions.add(
      this.dialogService
        .openPauseExperimentModal(experiment.conditions, PAUSE_BEHAVIOR_MODAL_MODE.PAUSE, experiment.name)
        .afterClosed()
        .subscribe((result) => {
          if (result) {
            // Update experiment with new state and pause behavior
            const updatedExperiment = {
              ...experiment,
              state: EXPERIMENT_STATE.PAUSED,
              postExperimentRule: result.postExperimentRule,
              revertTo: result.revertTo,
            };
            this.experimentService.updateExperiment(updatedExperiment);
          }
        })
    );
  }

  private handleResumeExperiment(experiment: Experiment): void {
    this.subscriptions.add(
      this.dialogService
        .openResumeExperimentModal(experiment.name)
        .afterClosed()
        .subscribe((confirmed: boolean) => {
          if (confirmed) {
            const experimentStateInfo: ExperimentStateInfo = {
              newStatus: EXPERIMENT_STATE.RUNNING,
            };
            this.experimentService.updateExperimentState(experiment.id, experimentStateInfo);
          }
        })
    );
  }

  private handleStopExperiment(experiment: Experiment): void {
    this.subscriptions.add(
      this.dialogService
        .openStopExperimentModal(experiment.name, this.experimentService.isLoadingExperimentDelete$)
        .afterClosed()
        .subscribe((confirmed: boolean) => {
          if (confirmed) {
            const experimentStateInfo: ExperimentStateInfo = {
              newStatus: EXPERIMENT_STATE.COMPLETED,
            };
            this.experimentService.updateExperimentState(experiment.id, experimentStateInfo);
          }
        })
    );
  }

  private formatTooltip(reasons: string[]): string {
    const header = this.translate.instant('experiments.details.start-experiment.validation.header.text');
    const messages = reasons.map((key) =>
      this.translate.instant(`experiments.details.start-experiment.validation.${key}.text`)
    );
    return `${header}\n${messages.join('\n')}`;
  }

  getPauseBehaviorText(experiment: Experiment): string {
    if (experiment.postExperimentRule === POST_EXPERIMENT_RULE.CONTINUE) {
      return this.translate.instant('experiments.details.pause-behavior-keep-conditions.text');
    } else if (experiment.postExperimentRule === POST_EXPERIMENT_RULE.ASSIGN && !experiment.revertTo) {
      return this.translate.instant('experiments.details.pause-behavior-no-condition.text');
    } else if (experiment.postExperimentRule === POST_EXPERIMENT_RULE.ASSIGN && experiment.revertTo) {
      // Find the condition name from revertTo ID
      const condition = experiment.conditions?.find((c) => c.id === experiment.revertTo);
      const conditionName = condition ? condition.conditionCode : 'Unknown';
      return this.translate.instant('experiments.details.pause-behavior-assign.text', { conditionName });
    }
    return '';
  }

  handlePauseBehaviorClick(experiment: Experiment): void {
    this.subscriptions.add(
      this.dialogService
        .openPauseExperimentModal(
          experiment.conditions,
          PAUSE_BEHAVIOR_MODAL_MODE.UPDATE,
          undefined,
          experiment.postExperimentRule,
          experiment.revertTo
        )
        .afterClosed()
        .subscribe((result) => {
          if (result) {
            // Update the experiment with new pause behavior
            const updatedExperiment = {
              ...experiment,
              postExperimentRule: result.postExperimentRule,
              revertTo: result.revertTo,
            };
            this.experimentService.updateExperiment(updatedExperiment);
          }
        })
    );
  }

  // Expose enums to template
  get EXPERIMENT_STATE() {
    return EXPERIMENT_STATE;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
