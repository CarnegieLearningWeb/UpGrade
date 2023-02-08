import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, map, Observable, Subscription } from 'rxjs';
import { ExperimentDesignStepperService } from '../../../../../../core/experiment-design-stepper/experiment-design-stepper.service';
import { ExperimentAliasTableRow } from '../../../../../../core/experiment-design-stepper/store/experiment-design-stepper.model';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import {
  ExperimentCondition,
  ExperimentDecisionPoint,
  ExperimentVM,
  TableEditModeDetails,
} from '../../../../../../core/experiments/store/experiments.model';
@Component({
  selector: 'app-aliases-table',
  templateUrl: './aliases-table.component.html',
  styleUrls: ['./aliases-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AliasesTableComponent implements OnInit, OnDestroy {
  @Output() aliasTableData$ = new EventEmitter<ExperimentAliasTableRow[]>();
  @Output() hideAliasTable = new EventEmitter<boolean>();
  @Input() designData$: Observable<[ExperimentDecisionPoint[], ExperimentCondition[]]>;
  @Input() experimentInfo: ExperimentVM;

  subscriptions: Subscription;
  isAliasTableEditMode$: Observable<boolean>;
  aliasTableEditIndex$: Observable<number>;
  currentContextMetaDataConditions$: Observable<string[]>;
  filteredContextMetaDataConditions$ = new BehaviorSubject<string[]>(['']);
  currentAliasInput$ = new BehaviorSubject<string>('');

  aliasTableData: ExperimentAliasTableRow[] = [];
  aliasesDisplayedColumns = ['site', 'target', 'condition', 'alias', 'actions'];

  initialLoad = true;

  constructor(
    private experimentService: ExperimentService,
    private experimentDesignStepperService: ExperimentDesignStepperService
  ) {}

  ngOnInit(): void {
    this.isAliasTableEditMode$ = this.experimentDesignStepperService.isAliasTableEditMode$;
    this.aliasTableEditIndex$ = this.experimentDesignStepperService.aliasTableEditIndex$;
    this.currentContextMetaDataConditions$ = this.experimentService.currentContextMetaDataConditions$;
  }

  ngAfterViewInit(): void {
    // must sub after view init to ensure table reference is loaded before emitting table data
    this.subscriptions = this.designData$.subscribe(
      (designData: [ExperimentDecisionPoint[], ExperimentCondition[]]) => {
        const [decisionPoints, conditions] = designData;
        const conditionAliases = this.experimentInfo?.conditionAliases;
        const useExistingAliasData = !!(conditionAliases && this.initialLoad);

        this.aliasTableData = this.experimentDesignStepperService.createAliasTableData(
          decisionPoints,
          conditions,
          conditionAliases,
          useExistingAliasData
        );
        this.initialLoad = false;
        this.aliasTableData$.emit(this.aliasTableData);
      }
    );

    this.subscriptions = combineLatest([this.currentContextMetaDataConditions$, this.currentAliasInput$])
      .pipe(
        filter(([conditions, input]) => !!conditions && !!this.experimentDesignStepperService.isValidString(input)),
        map(([conditions, input]) =>
          conditions.filter((condition: string) => condition.toLowerCase().includes(input.toLowerCase()))
        )
      )
      .subscribe(this.filteredContextMetaDataConditions$);
  }

  ngOnDestroy(): void {
    this.experimentDesignStepperService.setUpdateAliasTableEditMode({
      isEditMode: false,
      rowIndex: null,
    });
    this.subscriptions.unsubscribe();
  }

  handleHideClick() {
    this.hideAliasTable.emit(true);
  }

  handleEditClick(rowData: ExperimentAliasTableRow, rowIndex: number) {
    if (rowData.isEditing && !this.experimentDesignStepperService.isValidString(rowData.alias)) {
      rowData.alias = rowData.condition;
    }

    rowData.isEditing = !rowData.isEditing;

    const isEditMode = this.aliasTableData.some((rowData) => rowData.isEditing);
    const editModeDetails: TableEditModeDetails = {
      isEditMode,
      rowIndex: isEditMode ? rowIndex : null,
    };
    this.experimentDesignStepperService.setUpdateAliasTableEditMode(editModeDetails);
    this.currentAliasInput$.next(rowData.alias);
  }

  handleFilterContextMetaDataConditions(value: string) {
    this.currentAliasInput$.next(value);
  }
}
