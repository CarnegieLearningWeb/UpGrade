import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { AppState } from '../core.state';
import {
  ExperimentPartition,
  ExperimentCondition,
  ExperimentConditionAlias,
  TableEditModeDetails,
  ExperimentVM,
} from '../experiments/store/experiments.model';
import * as experimentDesignStepperAction from './store/experiment-design-stepper.actions';
import {
  selectAliasTableEditIndex,
  selectConditionsEditModePreviousRowData,
  selectConditionsTableEditIndex,
  selectFactorialConditionsEditModePreviousRowData,
  selectFactorialConditionsTableEditIndex,
  selectFactorialConditionTableData,
  selectFactorialDesignData,
  selecthasExperimentStepperDataChanged,
  selectIsAliasTableEditMode,
  selectIsConditionsTableEditMode,
  selectIsFactorialConditionsTableEditMode,
  selectIsFormLockedForEdit,
} from './store/experiment-design-stepper.selectors';
import {
  ConditionsTableRowData,
  ExperimentAliasTableRow,
  ExperimentFactorialDesignData,
  FactorialConditionRequestObject,
  FactorialConditionTableRowData,
} from './store/experiment-design-stepper.model';
import { actionUpdateFactorialTableData } from './store/experiment-design-stepper.actions';
import { BehaviorSubject, distinctUntilChanged, partition } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import * as isEqual from 'lodash.isequal';

@Injectable({
  providedIn: 'root',
})
export class ExperimentDesignStepperService {
  expStepperDataChangedFlag = false;
  isFormLockedForEdit$ = this.store$.pipe(select(selectIsFormLockedForEdit));
  hasExperimentStepperDataChanged$ = this.store$.pipe(select(selecthasExperimentStepperDataChanged));
  isAliasTableEditMode$ = this.store$.pipe(select(selectIsAliasTableEditMode));
  aliasTableEditIndex$ = this.store$.pipe(select(selectAliasTableEditIndex));
  isConditionsTableEditMode$ = this.store$.pipe(select(selectIsConditionsTableEditMode));
  conditionsTableEditIndex$ = this.store$.pipe(select(selectConditionsTableEditIndex));
  conditionsEditModePreviousRowData$ = this.store$.pipe(select(selectConditionsEditModePreviousRowData));
  factorialDesignData$ = this.store$.pipe(select(selectFactorialDesignData), distinctUntilChanged(isEqual));
  factorialConditionTableData$ = this.store$.pipe(
    select(selectFactorialConditionTableData),
    distinctUntilChanged(isEqual)
  );
  factorialConditionTableDataBehaviorSubject$ = new BehaviorSubject<FactorialConditionTableRowData[]>([]);
  isFactorialConditionsTableEditMode$ = this.store$.pipe(select(selectIsFactorialConditionsTableEditMode));
  factorialConditionsTableEditIndex$ = this.store$.pipe(select(selectFactorialConditionsTableEditIndex));
  factorialConditionsEditModePreviousRowData$ = this.store$.pipe(
    select(selectFactorialConditionsEditModePreviousRowData)
  );

  constructor(private store$: Store<AppState>) {
    this.hasExperimentStepperDataChanged$.subscribe(
      (isDataChanged) => (this.expStepperDataChangedFlag = isDataChanged)
    );
    this.factorialConditionTableData$.subscribe(this.factorialConditionTableDataBehaviorSubject$);
  }

  getHasExperimentDesignStepperDataChanged() {
    return this.expStepperDataChangedFlag;
  }

  getFactorialConditionTableData() {
    return this.factorialConditionTableDataBehaviorSubject$.getValue();
  }

  experimentStepperDataChanged() {
    this.store$.dispatch(experimentDesignStepperAction.experimentStepperDataChanged());
  }

  experimentStepperDataReset() {
    this.store$.dispatch(experimentDesignStepperAction.experimentStepperDataReset());
  }

  isValidString(value: any) {
    return typeof value === 'string' && value.trim();
  }

  formatDisplayWeight(weight: string | number): string {
    let roundedWeight: string;

    if (typeof weight === 'string') {
      roundedWeight = parseFloat(weight).toFixed(1);
    } else {
      roundedWeight = weight.toFixed(1);
    }

    const ellipsis = roundedWeight === weight ? '' : '...';

    return roundedWeight + ellipsis;
  }

  filterForUnchangedDesignData(designData: [ExperimentPartition[], ExperimentCondition[]][]): boolean {
    const [previous, current] = designData;
    const prevSiteTargets: string[] = previous[0].map((dp) => dp.site?.trim() + dp.target?.trim());
    const prevConditions: string[] = previous[1].map((c) => c.conditionCode?.trim());
    const currentSiteTargets: string[] = current[0].map((dp) => dp.site?.trim() + dp.target?.trim());
    const currentConditions: string[] = current[1].map((c) => c.conditionCode?.trim());

    const prev = prevSiteTargets.concat(prevConditions);
    const curr = currentSiteTargets.concat(currentConditions);

    const same = JSON.stringify(prev) === JSON.stringify(curr);

    return !same;
  }

  validDesignDataFilter(designData: [ExperimentPartition[], ExperimentCondition[]]): boolean {
    const [partitions, conditions] = designData;

    if (!partitions.length || !conditions.length) {
      return false;
    }
    const hasValidDecisionPointStrings = partitions.every(
      ({ site, target }) => this.isValidString(site) && this.isValidString(target)
    );
    const hasValidConditionStrings = conditions.every(({ conditionCode }) => this.isValidString(conditionCode));
    return hasValidDecisionPointStrings && hasValidConditionStrings;
  }

  createAliasTableData(
    decisionPoints: ExperimentPartition[],
    conditions: ExperimentCondition[],
    conditionAliases: ExperimentConditionAlias[],
    useExistingAliasData: boolean
  ): ExperimentAliasTableRow[] {
    const aliasTableData: ExperimentAliasTableRow[] = [];

    decisionPoints.forEach((decisionPoint, index) => {
      conditions.forEach((condition) => {
        // check the list of condtionAliases, if exist, to see if this parentCondition has an alias match
        let existingAlias: ExperimentConditionAlias = null;

        if (useExistingAliasData) {
          existingAlias = conditionAliases.find(
            (alias) =>
              alias.decisionPoint.target === decisionPoint.target &&
              alias.decisionPoint.site === decisionPoint.site &&
              alias.parentCondition.conditionCode === condition.conditionCode
          );
        }

        aliasTableData.push({
          id: existingAlias?.id,
          site: decisionPoint.site,
          target: decisionPoint.target,
          condition: condition.conditionCode,
          alias: existingAlias?.aliasName || condition.conditionCode,
          isEditing: false,
          rowStyle: index % 2 === 0 ? 'even' : 'odd',
        });
      });
    });

    return aliasTableData;
  }

  createNewFactorialConditionTableData(designData: ExperimentFactorialDesignData): FactorialConditionTableRowData[] {
    const tableData: FactorialConditionTableRowData[] = [];

    // currently this table will only support 2 factors due to design constraints
    // this will need revisited to support more factors in this table

    const factorOne = designData.factors[0];
    const factorTwo = designData.factors[1];

    factorOne.levels.forEach((factorOneLevel) => {
      factorTwo.levels.forEach((factorTwoLevel) => {
        const tableRow: FactorialConditionTableRowData = {
          id: uuidv4(), // TODO: maybe not the right place?
          levels: [
            {
              id: factorOneLevel.id,
              name: factorOneLevel.level,
            },
            {
              id: factorTwoLevel.id,
              name: factorTwoLevel.level,
            },
          ],
          alias: this.createFactorialAliasString(
            factorOne.factor,
            factorOneLevel.level,
            factorTwo.factor,
            factorTwoLevel.level
          ),
          weight: '0.0',
          include: true,
        };

        tableData.push(tableRow);
      });
    });

    return tableData;
  }

  mergeExistingConditionsTableData(
    designData: ExperimentFactorialDesignData,
    experimentInfo: ExperimentVM
  ): FactorialConditionTableRowData[] {
    const existingConditions = experimentInfo.conditions;
    const existingConditionAliases = experimentInfo.conditionAliases;
    const existingPartitions = experimentInfo.partitions;

    const levelOrder = {};
    existingPartitions.forEach((partition) => {
      partition.factors.forEach((factor) => {
        factor.levels.forEach((level) => {
          levelOrder[level.id] = factor.order;
        });
      });
    });

    const tableData = existingConditions.map((factorialCondition) => {
      const conditionAlias = existingConditionAliases.find(
        (conditionAlias) => conditionAlias?.parentCondition.id === factorialCondition.id
      );

      const aliasname = conditionAlias ? conditionAlias.aliasName : '';
      const existingConditionAliasId = conditionAlias?.id;

      // const allLevelsForCondition = factorialCondition.levelCombinationElements
      //   .sort((a, b) => (levelOrder[a.level.id] > levelOrder[b.level.id] ? 1 : levelOrder[b.level.id] > levelOrder[a.level.id] ? -1 : 0));

      const tableRow: FactorialConditionTableRowData = {
        id: factorialCondition.id,
        conditionAliasId: existingConditionAliasId,
        levels: factorialCondition.levelCombinationElements.map((levelElement) => {
          if (levelElement.level) {
            return {
              id: levelElement.level.id,
              name: levelElement.level.name,
            };
          } else {
            let levelDetail: any;
            existingPartitions.forEach((partition) => {
              partition.factors.forEach((factor) => {
                levelDetail = factor.levels.find((level) => level.id === levelElement.id);
              });
            });
            return {
              id: levelDetail.id,
              name: levelDetail.name,
            };
          }
        }),
        alias: aliasname,
        weight: factorialCondition.assignmentWeight.toString(),
        include: factorialCondition.assignmentWeight > 0,
      };
      return tableRow;
    });
    return tableData;
  }

  createFactorialConditionRequestObject() {
    const tableData = this.getFactorialConditionTableData();
    const factorialConditionsRequestObject: FactorialConditionRequestObject[] = [];
    let conditionIndex = 1;
    tableData.forEach((factorialConditionTableRow) => {
      factorialConditionsRequestObject.push({
        id: factorialConditionTableRow.id,
        name: 'condition ' + conditionIndex, // what should this be?
        conditionCode: 'condition ' + conditionIndex, // what should this be?
        assignmentWeight: parseFloat(factorialConditionTableRow.weight),
        order: conditionIndex++,
        levelCombinationElements: factorialConditionTableRow.levels.map((level) => {
          return {
            id: uuidv4(),
            level: level,
          };
        }),
      });
    });

    return factorialConditionsRequestObject;
  }

  createFactorialConditionsConditionAliasesRequestObject() {
    const tableData = this.getFactorialConditionTableData();
    const factorialConditionAliasesRequestObject = [];

    tableData.forEach((factorialConditionTableRow) => {
      factorialConditionAliasesRequestObject.push({
        id: factorialConditionTableRow.conditionAliasId || uuidv4(),
        aliasName: factorialConditionTableRow.alias,
        parentCondition: factorialConditionTableRow.id,
      });
    });

    return factorialConditionAliasesRequestObject;
  }

  createFactorialAliasString(
    factorOneName: string,
    factorOneLevel: string,
    factorTwoName: string,
    factorTwoLevel: string
  ) {
    return `${factorOneName}=${factorOneLevel}; ${factorTwoName}=${factorTwoLevel}`;
  }

  updateFactorialDesignData(designData: ExperimentFactorialDesignData) {
    // designData = DUMMY_CONDITION_TABLE_DATA;

    this.store$.dispatch(experimentDesignStepperAction.actionUpdateFactorialDesignData({ designData }));
  }

  updateFactorialTableData(tableData: FactorialConditionTableRowData[]) {
    this.store$.dispatch(actionUpdateFactorialTableData({ tableData }));
  }

  setUpdateAliasTableEditMode(details: TableEditModeDetails): void {
    this.store$.dispatch(
      experimentDesignStepperAction.actionUpdateAliasTableEditMode({
        isAliasTableEditMode: details.isEditMode,
        aliasTableEditIndex: details.rowIndex,
      })
    );
  }

  setConditionTableEditModeDetails(rowIndex: number, rowData: ConditionsTableRowData): void {
    this.store$.dispatch(
      experimentDesignStepperAction.actionToggleConditionsTableEditMode({
        conditionsTableEditIndex: rowIndex,
        conditionsRowData: rowData,
      })
    );
  }

  setFactorialConditionTableEditModeDetails(rowIndex: number, rowData: FactorialConditionTableRowData): void {
    this.store$.dispatch(
      experimentDesignStepperAction.actionToggleFactorialConditionsTableEditMode({
        factorialConditionsTableEditIndex: rowIndex,
        factorialConditionsRowData: rowData,
      })
    );
  }

  clearConditionTableEditModeDetails(): void {
    this.store$.dispatch(experimentDesignStepperAction.actionClearConditionTableEditDetails());
  }

  clearFactorialConditionTableEditModeDetails(): void {
    this.store$.dispatch(experimentDesignStepperAction.actionClearFactorialConditionTableEditDetails());
  }

  clearFactorialDesignStepperData(): void {
    this.store$.dispatch(experimentDesignStepperAction.clearFactorialDesignStepperData());
  }
}
