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
import { Observable } from 'rxjs';
import { Experiment } from '../../../../../../../core/experiments/store/experiments.model';
import { Router } from '@angular/router';

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

  experiment$: Observable<Experiment> = this.experimentService.selectedExperiment$;
  experimentOverviewDetails$ = this.experimentService.selectedExperimentOverviewDetails$;

  constructor(private experimentService: ExperimentService, private router: Router) {}

  ngOnInit(): void {
    // Any initialization logic can go here
  }

  filterExperimentByChips(tagValue: string) {
    this.experimentService.setSearchKey(EXPERIMENT_SEARCH_KEY.TAG);
    this.experimentService.setSearchString(tagValue);
    this.router.navigate(['/experiments']);
  }

  menuButtonItems: IMenuButtonItem[] = [
    {
      label: 'experiments.details.menu-button.edit-experiment.text',
      action: EXPERIMENT_DETAILS_PAGE_ACTIONS.EDIT,
      disabled: false, // TODO: Add permission check
    },
    {
      label: 'experiments.details.menu-button.duplicate-experiment.text',
      action: EXPERIMENT_DETAILS_PAGE_ACTIONS.DUPLICATE,
      disabled: false, // TODO: Add permission check
    },
    {
      label: 'experiments.details.menu-button.export-experiment-design.text',
      action: EXPERIMENT_DETAILS_PAGE_ACTIONS.EXPORT_DESIGN,
      disabled: false,
    },
    {
      label: 'experiments.details.menu-button.email-data.text',
      action: EXPERIMENT_DETAILS_PAGE_ACTIONS.EMAIL_DATA,
      disabled: true, // TODO: Implement email data functionality
    },
    {
      label: 'experiments.details.menu-button.archive.text',
      action: EXPERIMENT_DETAILS_PAGE_ACTIONS.ARCHIVE,
      disabled: true, // TODO: Implement archive functionality
    },
    {
      label: 'experiments.details.menu-button.delete-experiment.text',
      action: EXPERIMENT_DETAILS_PAGE_ACTIONS.DELETE,
      disabled: false, // TODO: Add permission check and status check
    },
  ];

  onSectionCardExpandChange(expanded: boolean): void {
    this.isSectionCardExpanded = expanded;
    this.sectionCardExpandChange.emit(expanded);
  }

  onSelectedTabChange(tabIndex: number): void {
    this.tabChange.emit(tabIndex);
  }

  onMenuButtonItemClick(action: EXPERIMENT_DETAILS_PAGE_ACTIONS): void {
    switch (action) {
      case EXPERIMENT_DETAILS_PAGE_ACTIONS.DELETE:
        console.log('Delete experiment - TODO: Implement dialog service');
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
        console.log('Export experiment design - TODO: Implement');
        break;
      case EXPERIMENT_DETAILS_PAGE_ACTIONS.EMAIL_DATA:
        console.log('Email experiment data - TODO: Implement');
        break;
      default:
        console.log('Unknown action');
    }
  }
}
