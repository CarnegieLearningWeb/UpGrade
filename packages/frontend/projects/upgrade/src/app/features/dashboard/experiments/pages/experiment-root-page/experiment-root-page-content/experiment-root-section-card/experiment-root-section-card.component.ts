import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  CommonSectionCardComponent,
  CommonSectionCardSearchHeaderComponent,
  CommonSectionCardActionButtonsComponent,
} from '@shared-component-lib';
import { ExperimentService } from '../../../../../../../core/experiments/experiments.service';
import { AsyncPipe } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ExperimentRootSectionCardTableComponent } from './experiment-root-section-card-table/experiment-root-section-card-table.component';
import { TranslateModule } from '@ngx-translate/core';
import { EXPERIMENT_SEARCH_KEY, IMenuButtonItem } from 'upgrade_types';

import { DialogService } from '../../../../../../../shared/services/common-dialog.service';
import { Observable, map } from 'rxjs';
import { EXPERIMENT_BUTTON_ACTION } from '../../../../../../../core/experiments/store/experiments.model';
import { CommonSearchWidgetSearchParams } from '@shared-component-lib/common-section-card-search-header/common-section-card-search-header.component';

import { UserPermission } from '../../../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../../../core/auth/auth.service';
import { StratificationFactorsService } from '../../../../../../../core/stratification-factors/stratification-factors.service';

@Component({
  selector: 'app-experiment-root-section-card',
  imports: [
    CommonSectionCardComponent,
    CommonSectionCardSearchHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    ExperimentRootSectionCardTableComponent,
    AsyncPipe,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  templateUrl: './experiment-root-section-card.component.html',
  styleUrl: './experiment-root-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentRootSectionCardComponent {
  permissions$: Observable<UserPermission>;
  experiments$ = this.experimentService.experiments$;
  isLoadingExperiments$ = this.experimentService.isLoadingExperiment$;
  isInitialLoading$ = this.experimentService.haveInitialExperimentsLoaded();
  searchString$ = this.experimentService.selectSearchString$;
  searchKey$ = this.experimentService.selectSearchKey$;
  searchParams$ = this.experimentService.searchParams$;
  selectRootTableState$ = this.experimentService.selectRootTableState$;
  isSearchActive$: Observable<boolean> = this.searchString$.pipe(map((searchString) => !!searchString));
  expandedTagsMap = new Map<string, boolean>();

  experimentFilterOption = [
    { value: EXPERIMENT_SEARCH_KEY.ALL, type: 'text' },
    { value: EXPERIMENT_SEARCH_KEY.NAME, type: 'text' },
    {
      value: EXPERIMENT_SEARCH_KEY.STATUS,
      type: 'dropdown',
      valueOptions: ['Inactive', 'Archived', 'Running', 'Completed', 'Paused'],
    },
    { value: EXPERIMENT_SEARCH_KEY.CONTEXT, type: 'text' },
    { value: EXPERIMENT_SEARCH_KEY.TAG, type: 'text' },
    { value: EXPERIMENT_SEARCH_KEY.DECISION_POINT, type: 'text' },
  ];
  isSectionCardExpanded = true;

  menuButtonItems: IMenuButtonItem[] = [
    {
      label: 'experiments.import-experiment.text',
      action: EXPERIMENT_BUTTON_ACTION.IMPORT,
      disabled: false,
    },
    {
      label: 'experiments.export-all-experiments.text',
      action: EXPERIMENT_BUTTON_ACTION.EXPORT_ALL,
      disabled: true,
    },
  ];

  constructor(
    private experimentService: ExperimentService,
    private stratificationFactorsService: StratificationFactorsService,
    private dialogService: DialogService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
    this.experimentService.loadExperiments(true);
    this.stratificationFactorsService.fetchStratificationFactors(true);
    this.experimentService.fetchAllExperimentNames();
  }

  onSearch(params: CommonSearchWidgetSearchParams<EXPERIMENT_SEARCH_KEY>) {
    this.experimentService.setSearchKey(params.searchKey as EXPERIMENT_SEARCH_KEY);
    this.experimentService.setSearchString(params.searchString?.trim() || '');
  }

  onAddExperimentButtonClick() {
    this.dialogService.openAddExperimentModal();
  }

  onMenuButtonItemClick(action: string) {
    if (action === EXPERIMENT_BUTTON_ACTION.IMPORT) {
      this.dialogService.openImportExperimentModal();
    }
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean) {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }

  toggleTagExpansion(experimentId: string): void {
    this.expandedTagsMap.set(experimentId, !(this.expandedTagsMap.get(experimentId) || false));
  }

  isTagsExpanded(experimentId: string): boolean {
    return this.expandedTagsMap.get(experimentId) || false;
  }

  onTagsExpanded(experimentId: string, expanded: boolean): void {
    this.expandedTagsMap.set(experimentId, expanded);
  }
}
