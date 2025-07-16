import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { IMenuButtonItem, FILTER_MODE } from 'upgrade_types';
import { ExperimentInclusionsTableComponent } from './experiment-inclusions-table/experiment-inclusions-table.component';
import { ExperimentService } from '../../../../../../../core/experiments/experiments.service';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Observable, map } from 'rxjs';
import { Experiment, EXPERIMENT_BUTTON_ACTION } from '../../../../../../../core/experiments/store/experiments.model';
import { UserPermission } from '../../../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../../../core/auth/auth.service';

@Component({
  selector: 'app-experiment-inclusions-section-card',
  imports: [
    CommonModule,
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    ExperimentInclusionsTableComponent,
    TranslateModule,
  ],
  templateUrl: './experiment-inclusions-section-card.component.html',
  styleUrl: './experiment-inclusions-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentInclusionsSectionCardComponent implements OnInit {
  @Input() isSectionCardExpanded = true;

  permissions$: Observable<UserPermission>;
  selectedExperiment$ = this.experimentService.selectedExperiment$;

  // TODO: Add tableRowCount$ when experiment inclusions are implemented
  tableRowCount = 0;

  menuButtonItems: IMenuButtonItem[] = [
    {
      label: 'experiments.details.import-include-list.menu-item.text',
      action: EXPERIMENT_BUTTON_ACTION.IMPORT_INCLUDE_LIST,
      disabled: false,
    },
    {
      label: 'experiments.details.export-all-include-lists.menu-item.text',
      action: EXPERIMENT_BUTTON_ACTION.EXPORT_ALL_INCLUDE_LISTS,
      disabled: false,
    },
  ];

  rowCountWithInclude$: Observable<number> = this.selectedExperiment$.pipe(
    map((selectedExperiment) => (selectedExperiment?.filterMode === FILTER_MODE.INCLUDE_ALL ? 0 : this.tableRowCount))
  );

  get FILTER_MODE() {
    return FILTER_MODE;
  }

  constructor(private experimentService: ExperimentService, private authService: AuthService) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
  }

  onAddInclusionClick(): void {
    // TODO: Implement add inclusion functionality when dialog service is available
    console.log('Add inclusion clicked');
  }

  onSlideToggleChange(event: MatSlideToggleChange, experimentId: string): void {
    // TODO: Implement slide toggle functionality when experiment service methods are available
    console.log('Slide toggle changed:', event.checked, experimentId);
  }

  onMenuButtonItemClick(event: string, experiment: Experiment): void {
    switch (event) {
      case EXPERIMENT_BUTTON_ACTION.IMPORT_INCLUDE_LIST:
        // TODO: Implement import functionality when dialog service is available
        console.log('Import include list clicked for experiment:', experiment.id);
        break;
      case EXPERIMENT_BUTTON_ACTION.EXPORT_ALL_INCLUDE_LISTS:
        // TODO: Implement export functionality when experiment service methods are available
        console.log('Export all include lists clicked for experiment:', experiment.id);
        break;
      default:
        console.log('Unknown action:', event);
    }
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean): void {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }
}
