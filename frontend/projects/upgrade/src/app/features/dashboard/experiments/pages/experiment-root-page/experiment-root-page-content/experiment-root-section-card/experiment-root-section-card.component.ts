import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  CommonSectionCardComponent,
  CommonSectionCardSearchHeaderComponent,
  CommonSectionCardActionButtonsComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { ExperimentService } from '../../../../../../../core/experiments/experiments.service';
import { AsyncPipe, NgIf } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ExperimentRootSectionCardTableComponent } from './experiment-root-section-card-table/experiment-root-section-card-table.component';
import { TranslateModule } from '@ngx-translate/core';
import { EXPERIMENT_SEARCH_KEY, IMenuButtonItem } from 'upgrade_types';
import { MatTableDataSource } from '@angular/material/table';
import { DialogService } from '../../../../../../../shared/services/common-dialog.service';
import { Observable, map } from 'rxjs';
import { EXPERIMENT_BUTTON_ACTION, Experiment } from '../../../../../../../core/experiments/store/experiments.model';
import { CommonSearchWidgetSearchParams } from '../../../../../../../shared-standalone-component-lib/components/common-section-card-search-header/common-section-card-search-header.component';
import {
  CommonTableHelpersService,
  TableState,
} from '../../../../../../../shared/services/common-table-helpers.service';
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
    NgIf,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  templateUrl: './experiment-root-section-card.component.html',
  styleUrl: './experiment-root-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentRootSectionCardComponent {
  permissions$: Observable<UserPermission>;
  dataSource$: Observable<MatTableDataSource<Experiment>>;
  isLoadingExperiments$ = this.experimentService.isLoadingExperiment$;
  isInitialLoading$ = this.experimentService.haveInitialExperimentsLoaded();
  searchString$ = this.experimentService.selectSearchString$;
  searchKey$ = this.experimentService.selectSearchKey$;
  searchParams$ = this.experimentService.searchParams$;
  selectRootTableState$ = this.experimentService.selectRootTableState$;
  isSearchActive$: Observable<boolean> = this.searchString$.pipe(map((searchString) => !!searchString));
  expandedTagsMap = new Map<string, boolean>();

  experimentFilterOption = [
    EXPERIMENT_SEARCH_KEY.ALL,
    EXPERIMENT_SEARCH_KEY.NAME,
    EXPERIMENT_SEARCH_KEY.STATUS,
    EXPERIMENT_SEARCH_KEY.CONTEXT,
    EXPERIMENT_SEARCH_KEY.TAG,
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
    private tableHelpersService: CommonTableHelpersService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
    this.experimentService.loadExperiments(true);
    this.stratificationFactorsService.fetchStratificationFactors(true);
    this.experimentService.fetchAllExperimentNames();
  }

  ngAfterViewInit() {
    this.dataSource$ = this.experimentService.selectRootTableState$.pipe(
      map((tableState: TableState<Experiment>) => {
        return this.tableHelpersService.mapTableStateToDataSource<Experiment>(tableState);
      })
    );
  }

  onSearch(params: CommonSearchWidgetSearchParams<EXPERIMENT_SEARCH_KEY>) {
    this.experimentService.setSearchString(params.searchString?.trim());
    this.experimentService.setSearchKey(params.searchKey as EXPERIMENT_SEARCH_KEY);
  }

  onAddExperimentButtonClick() {
    this.dialogService.openAddExperimentModal();
  }

  onMenuButtonItemClick(action: string) {
    if (action === EXPERIMENT_BUTTON_ACTION.IMPORT) {
      // this.dialogService.openImportExperimentModal();
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
