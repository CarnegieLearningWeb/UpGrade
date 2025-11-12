import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
  CommonSectionCardOverviewDetailsComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { ExperimentOverviewDetailsFooterComponent } from './experiment-overview-details-footer/experiment-overview-details-footer.component';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { IMenuButtonItem, EXPERIMENT_SEARCH_KEY } from 'upgrade_types';
import { ExperimentService } from '../../../../../../../core/experiments/experiments.service';
import { combineLatest, map, Observable } from 'rxjs';
import { Experiment } from '../../../../../../../core/experiments/store/experiments.model';
import { Router } from '@angular/router';
import { DialogService } from '../../../../../../../shared/services/common-dialog.service';
import { UserPermission } from '../../../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../../../core/auth/auth.service';

export enum EXPERIMENT_DETAILS_PAGE_ACTIONS {
  EDIT = 'edit',
  DUPLICATE = 'duplicate',
  EXPORT_DESIGN = 'exportDesign',
  EMAIL_DATA = 'emailData',
  ARCHIVE = 'archive',
  DELETE = 'delete',
}

@Component({
  selector: 'app-experiment-overview-details-section-card',
  imports: [
    CommonModule,
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    CommonSectionCardOverviewDetailsComponent,
    ExperimentOverviewDetailsFooterComponent,
    TranslateModule,
  ],
  templateUrl: './experiment-overview-details-section-card.component.html',
  styleUrl: './experiment-overview-details-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentOverviewDetailsSectionCardComponent implements OnInit {
  @Input() isSectionCardExpanded = true;
  @Output() sectionCardExpandChange = new EventEmitter<boolean>();
  @Output() tabChange = new EventEmitter<number>();
  permissions$: Observable<UserPermission> = this.authService.userPermissions$;
  experiment$: Observable<Experiment> = this.experimentService.selectedExperiment$;
  experimentAndPermissions$: Observable<{ experiment: Experiment; permissions: UserPermission }> = combineLatest([
    this.experiment$,
    this.permissions$,
  ]).pipe(map(([experiment, permissions]) => ({ experiment, permissions })));
  experimentOverviewDetails$ = this.experimentService.selectedExperimentOverviewDetails$;
  menuButtonItems$: Observable<IMenuButtonItem[]>;

  constructor(
    private readonly experimentService: ExperimentService,
    private readonly dialogService: DialogService,
    private readonly router: Router,
    private readonly authService: AuthService
  ) {}

  filterExperimentByChips(tagValue: string) {
    this.experimentService.setSearchKey(EXPERIMENT_SEARCH_KEY.TAG);
    this.experimentService.setSearchString(tagValue);
    this.router.navigate(['/experiments']);
  }
  ngOnInit(): void {
    this.menuButtonItems$ = this.experimentAndPermissions$.pipe(
      map(({ experiment, permissions }) => [
        {
          label: 'experiments.details.edit-experiment.menu-item.text',
          action: EXPERIMENT_DETAILS_PAGE_ACTIONS.EDIT,
          disabled: !permissions?.experiments.update,
        },
        {
          label: 'experiments.details.duplicate-experiment.menu-item.text',
          action: EXPERIMENT_DETAILS_PAGE_ACTIONS.DUPLICATE,
          disabled: !permissions?.experiments.create,
        },
        {
          label: 'experiments.details.export-experiment-design.menu-item.text',
          action: EXPERIMENT_DETAILS_PAGE_ACTIONS.EXPORT_DESIGN,
          disabled: false,
        },
        {
          label: 'experiments.details.email-experiment-data.menu-item.text',
          action: EXPERIMENT_DETAILS_PAGE_ACTIONS.EMAIL_DATA,
          disabled: true, // TODO: Implement email data functionality
        },
        {
          label: 'experiments.details.archive-experiment.menu-item.text',
          action: EXPERIMENT_DETAILS_PAGE_ACTIONS.ARCHIVE,
          disabled: true, // TODO: Implement archive functionality
        },
        {
          label: 'experiments.details.delete-experiment.menu-item.text',
          action: EXPERIMENT_DETAILS_PAGE_ACTIONS.DELETE,
          disabled: !permissions?.experiments.delete, // TODO: check state to allow delete?
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
        this.dialogService.openDeleteExperimentModal();
        break;
      case EXPERIMENT_DETAILS_PAGE_ACTIONS.EDIT:
        console.log('Edit experiment - TODO: Implement dialog service');
        break;
      case EXPERIMENT_DETAILS_PAGE_ACTIONS.DUPLICATE:
        console.log('Duplicate experiment - TODO: Implement dialog service');
        break;
      case EXPERIMENT_DETAILS_PAGE_ACTIONS.ARCHIVE:
        console.log('Archive experiment - TODO: Implement');
        break;
      case EXPERIMENT_DETAILS_PAGE_ACTIONS.EXPORT_DESIGN:
        this.openConfirmExportDesignModal(experiment.id);
        break;
      case EXPERIMENT_DETAILS_PAGE_ACTIONS.EMAIL_DATA:
        console.log('Email experiment data - TODO: Implement');
        break;
      default:
        console.log('Unknown action');
    }
  }

  openConfirmExportDesignModal(id: string) {
    this.dialogService
      .openExportExperimentDesignModal()
      .afterClosed()
      .subscribe((isExportClicked: boolean) => {
        if (isExportClicked) {
          this.experimentService.exportExperimentDesign([id]);
        }
      });
  }
}
