import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { AppState } from '../core.state';
import {
  ExperimentDecisionPoint,
  ExperimentCondition,
  ExperimentConditionAlias,
  ExperimentVM,
  ExperimentFactor,
  ExperimentLevel,
} from '../experiments/store/experiments.model';
import * as experimentDesignStepperAction from './store/experiment-design-stepper.actions';
import {
  selectDecisionPointsEditModePreviousRowData,
  selectConditionsEditModePreviousRowData,
  selectDecisionPointsTableEditIndex,
  selectConditionsTableEditIndex,
  selectFactorialConditionsEditModePreviousRowData,
  selectFactorialConditionsTableEditIndex,
  selectFactorialConditionTableData,
  selectFactorialDesignData,
  selecthasExperimentStepperDataChanged,
  selectIsDecisionPointsTableEditMode,
  selectIsConditionsTableEditMode,
  selectIsFactorialConditionsTableEditMode,
  selectIsFormLockedForEdit,
  selectSimpleExperimentDesignData,
  selectSimpleExperimentAliasTableData,
  selectIsSimpleExperimentAliasTableEditMode,
  selectSimpleExperimentAliasTableEditIndex,
} from './store/experiment-design-stepper.selectors';
import {
  DecisionPointsTableRowData,
  ConditionsTableRowData,
  SimpleExperimentAliasTableRow,
  ExperimentFactorialDesignData,
  FactorialConditionRequestObject,
  FactorialConditionTableRowData,
  ExperimentConditionAliasRequestObject,
  SimpleExperimentDesignData,
  ExperimentFactorFormData
} from './store/experiment-design-stepper.model';
import {
  actionUpdateFactorialTableData,
  actionUpdateSimpleExperimentAliasTableData,
} from './store/experiment-design-stepper.actions';
import { BehaviorSubject, distinctUntilChanged } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import * as isEqual from 'lodash.isequal';

@Injectable({
  providedIn: 'root',
})
export class ExperimentDesignStepperService {
  expStepperDataChangedFlag = false;
  isFormLockedForEdit$ = this.store$.pipe(select(selectIsFormLockedForEdit));
  hasExperimentStepperDataChanged$ = this.store$.pipe(select(selecthasExperimentStepperDataChanged));
  isSimpleExperimentAliasTableEditMode$ = this.store$.pipe(select(selectIsSimpleExperimentAliasTableEditMode));
  simpleExperimentAliasTableEditIndex$ = this.store$.pipe(select(selectSimpleExperimentAliasTableEditIndex));

  isDecisionPointsTableEditMode$ = this.store$.pipe(select(selectIsDecisionPointsTableEditMode));
  decisionPointsTableEditIndex$ = this.store$.pipe(select(selectDecisionPointsTableEditIndex));
  decisionPointsEditModePreviousRowData$ = this.store$.pipe(select(selectDecisionPointsEditModePreviousRowData));

  isConditionsTableEditMode$ = this.store$.pipe(select(selectIsConditionsTableEditMode));
  conditionsTableEditIndex$ = this.store$.pipe(select(selectConditionsTableEditIndex));
  conditionsEditModePreviousRowData$ = this.store$.pipe(select(selectConditionsEditModePreviousRowData));
  factorialDesignData$ = this.store$.pipe(select(selectFactorialDesignData), distinctUntilChanged(isEqual));
  factorialConditionTableData$ = this.store$.pipe(
    select(selectFactorialConditionTableData),
    distinctUntilChanged(isEqual)
  );
  factorialConditionTableDataBehaviorSubject$ = new BehaviorSubject<FactorialConditionTableRowData[]>([]);
  simpleExperimentAliasTableDataBehaviorSubject$ = new BehaviorSubject<SimpleExperimentAliasTableRow[]>([]);

  isFactorialConditionsTableEditMode$ = this.store$.pipe(select(selectIsFactorialConditionsTableEditMode));
  factorialConditionsTableEditIndex$ = this.store$.pipe(select(selectFactorialConditionsTableEditIndex));
  factorialConditionsEditModePreviousRowData$ = this.store$.pipe(
    select(selectFactorialConditionsEditModePreviousRowData)
  );
  simpleExperimentDesignData$ = this.store$.pipe(
    select(selectSimpleExperimentDesignData),
    distinctUntilChanged(isEqual)
  );
  simpleExperimentAliasTableData$ = this.store$.pipe(
    select(selectSimpleExperimentAliasTableData),
    distinctUntilChanged(isEqual)
  );

  constructor(private store$: Store<AppState>) {
    this.hasExperimentStepperDataChanged$.subscribe(
      (isDataChanged) => (this.expStepperDataChangedFlag = isDataChanged)
    );
    this.factorialConditionTableData$.subscribe(this.factorialConditionTableDataBehaviorSubject$);
    this.simpleExperimentAliasTableData$.subscribe(this.simpleExperimentAliasTableDataBehaviorSubject$);
  }

  getHasExperimentDesignStepperDataChanged() {
    return this.expStepperDataChangedFlag;
  }

  getFactorialConditionTableData() {
    return this.factorialConditionTableDataBehaviorSubject$.getValue();
  }

  getSimpleExperimentAliasTableData() {
    return [...this.simpleExperimentAliasTableDataBehaviorSubject$.getValue()];
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

    return roundedWeight;
  }

  setNewSimpleExperimentAliasTableData(tableData: SimpleExperimentAliasTableRow[]) {
    this.store$.dispatch(actionUpdateSimpleExperimentAliasTableData({ tableData }));
  }

  setNewDesignData(designData: SimpleExperimentDesignData) {
    this.store$.dispatch(experimentDesignStepperAction.actionUpdateSimpleExperimentDesignData({ designData }));
  }

  validDesignDataFilter(designData: SimpleExperimentDesignData): boolean {
    const { decisionPoints, conditions } = designData;

    if (!decisionPoints.length || !conditions.length) {
      return false;
    }

    const hasValidDecisionPointStrings = decisionPoints.every(
      ({ site, target }) => this.isValidString(site) && this.isValidString(target)
    );
    const hasValidConditionStrings = conditions.every(({ conditionCode }) => this.isValidString(conditionCode));
    return hasValidDecisionPointStrings && hasValidConditionStrings;
  }

  updateAndStoreAliasTableData(
    decisionPoints: ExperimentDecisionPoint[],
    conditions: ExperimentCondition[],
    preexistingAliasRowData: SimpleExperimentAliasTableRow[]
  ): void {
    const aliasTableData = this.createAliasTableData(decisionPoints, conditions, preexistingAliasRowData);

    this.setNewSimpleExperimentAliasTableData(aliasTableData);
  }

  createAliasTableDataForViewExperiment(experiment: ExperimentVM) {
    const decisionPoints = experiment.partitions;
    const conditions = experiment.conditions;
    const conditionAliases = experiment.conditionAliases || [];
    const conditionAliasesRowData = this.getExistingConditionAliasRowData(conditionAliases);
    const aliasTableData = this.createAliasTableData(decisionPoints, conditions, conditionAliasesRowData);

    return aliasTableData;
  }

  createAliasTableData(
    decisionPoints: ExperimentDecisionPoint[],
    conditions: ExperimentCondition[],
    preexistingAliasRowData: SimpleExperimentAliasTableRow[]
  ): SimpleExperimentAliasTableRow[] {
    const aliasTableData: SimpleExperimentAliasTableRow[] = [];
    decisionPoints.forEach((decisionPoint, index) => {
      conditions.forEach((condition) => {
        // check if a condition alias exists for this decision point + condition combo
        const existingAlias = this.matchPreexistingAliasData({
          preexistingAliasRowData,
          decisionPoint,
          condition,
        });

        // assign a reference back to the decision point and condition rows if not an existingAlias
        const designTableCombinationId = existingAlias?.designTableCombinationId || decisionPoint.id + condition.id;

        const alias = existingAlias?.useCustom ? existingAlias.alias : condition.conditionCode;

        const aliasTableDataRow = {
          id: existingAlias?.id,
          designTableCombinationId,
          site: decisionPoint.site,
          target: decisionPoint.target,
          condition: condition.conditionCode,
          alias,
          rowStyle: index % 2 === 0 ? 'even' : 'odd',
          useCustom: existingAlias?.useCustom || false,
        };

        aliasTableData.push(aliasTableDataRow);
      });
    });

    return aliasTableData;
  }

  matchPreexistingAliasData({ preexistingAliasRowData, decisionPoint, condition }): SimpleExperimentAliasTableRow {
    let existingAlias: SimpleExperimentAliasTableRow = null;

    existingAlias = preexistingAliasRowData.find(
      (alias: SimpleExperimentAliasTableRow) => alias.designTableCombinationId === decisionPoint.id + condition.id
    );

    return existingAlias;
  }

  getExistingConditionAliasRowData(
    preexistingConditionAliasData: ExperimentConditionAlias[]
  ): SimpleExperimentAliasTableRow[] {
    const currentAliasTableData = this.getSimpleExperimentAliasTableData();

    if (preexistingConditionAliasData.length) {
      const aliasTableData = this.mapPreexistingConditionAliasesToTableData(preexistingConditionAliasData);
      return aliasTableData;
    }

    if (currentAliasTableData.length) {
      return currentAliasTableData;
    }

    return [];
  }

  mapPreexistingConditionAliasesToTableData(
    conditionAliases: ExperimentConditionAlias[]
  ): SimpleExperimentAliasTableRow[] {
    return conditionAliases.map((conditionAlias) => {
      return {
        id: conditionAlias.id,
        designTableCombinationId: conditionAlias.decisionPoint.id + conditionAlias.parentCondition.id,
        site: conditionAlias.decisionPoint.site,
        target: conditionAlias.decisionPoint.target,
        condition: conditionAlias.parentCondition.conditionCode,
        alias: conditionAlias.aliasName,
        useCustom: conditionAlias.aliasName !== conditionAlias.parentCondition.conditionCode,
      };
    });
  }

  createExperimentConditionAliasRequestObject({ decisionPoints, conditions }): ExperimentConditionAliasRequestObject[] {
    const conditionAliases: ExperimentConditionAliasRequestObject[] = [];
    const aliasTableData = this.getSimpleExperimentAliasTableData();

    aliasTableData.forEach((aliasRowData: SimpleExperimentAliasTableRow) => {
      // if no custom alias, return early, do not add to array to send to backend
      if (aliasRowData.alias === aliasRowData.condition) {
        return;
      }

      const parentCondition = conditions.find((condition) => condition.conditionCode === aliasRowData.condition);

      const decisionPoint = decisionPoints.find(
        (decisionPoint) => decisionPoint.target === aliasRowData.target && decisionPoint.site === aliasRowData.site
      );

      conditionAliases.push({
        id: aliasRowData.id || uuidv4(),
        aliasName: aliasRowData.alias,
        parentCondition: parentCondition.id,
        decisionPoint: decisionPoint.id,
      });
    });

    return conditionAliases;
  }

  createNewFactorialConditionTableData(designData: ExperimentFactorialDesignData): FactorialConditionTableRowData[] {
    const tableData: FactorialConditionTableRowData[] = [];

    // currently this table will only support 2 factors due to design constraints
    // this will need revisited to support more factors in this table

    const factorOne = designData.factors[0];
    const factorTwo = designData.factors[1];

    const tempTableData = this.withRecurssion(designData);

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
    console.log('tempTableData');
    console.log(tempTableData);
    console.log('tableData');
    console.log(tableData);

    return tableData;
  }

  withRecurssion(designData: ExperimentFactorialDesignData): FactorialConditionTableRowData[]{
    const tableData: FactorialConditionTableRowData[] = [];

    for (let i=0; i < designData.factors.length-1; i++){
      for (let j=i+1; j < designData.factors.length; j++){
        designData.factors[i].levels.forEach((factorOneLevel) => {
          designData.factors[j].levels.forEach((factorTwoLevel) => {
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
                designData.factors[i].factor,
                factorOneLevel.level,
                designData.factors[j].factor,
                factorTwoLevel.level
              ),
              weight: '0.0',
              include: true,
            };
    
            tableData.push(tableRow);
          });
        });
      }
    }

    return tableData;
  }

  // permutation(factors : any[]): FactorialConditionTableRowData[]{
  //   const tableData: FactorialConditionTableRowData[] = [];

  //   const permutations = [];
  //   for (let i=0; i < factors.length-1; i++){
  //     for (const rest of this.permutation(factors.slice(1))) {
  //       factors[i].levels.forEach((factorOneLevel) => {
  //         factors[j].levels.forEach((factorTwoLevel) => {
  //           const tableRow: FactorialConditionTableRowData = {
  //             id: uuidv4(), // TODO: maybe not the right place?
  //             levels: [
  //               {
  //                 id: factorOneLevel.id,
  //                 name: factorOneLevel.level,
  //               },
  //               {
  //                 id: factorTwoLevel.id,
  //                 name: factorTwoLevel.level,
  //               },
  //             ],
  //             alias: this.createFactorialAliasString(
  //               factors[i].factor,
  //               factorOneLevel.level,
  //               factors[j].factor,
  //               factorTwoLevel.level
  //             ),
  //             weight: '0.0',
  //             include: true,
  //           };
    
  //           tableData.push(tableRow);
  //         });
  //       });
  //     }
  //   }

  //   return tableData;
  // }

  convertToDecisionPointData(factorialExperimentDesignFormData: ExperimentFactorialDesignData) {
    let order = 1;
    let factorOrder = 1;
    const decisionPoints = [];
    factorialExperimentDesignFormData.factors.forEach((decisionPoint) => {
      let levelOrder = 1;
      const currentLevels: ExperimentLevel[] = decisionPoint.levels.map((level) => {
        return { name: level.level, alias: level.alias, id: level.id, order: levelOrder++ };
      });
      const currentFactors: ExperimentFactor = {
        name: decisionPoint.factor,
        order: factorOrder++,
        levels: currentLevels,
      };
      if (
        !decisionPoints
          .find(
            (existingDecisionPoint) =>
              existingDecisionPoint.site === decisionPoint.site && existingDecisionPoint.target === decisionPoint.target
          )
          ?.factors.push(currentFactors)
      ) {
        const decisionPointData = {
          site: decisionPoint.site,
          id: uuidv4(),
          description: '',
          order: order++,
          excludeIfReached: false,
          factors: [currentFactors],
        };
        decisionPoint.target
          ? decisionPoints.push({ ...decisionPointData, target: decisionPoint.target })
          : decisionPoints.push(decisionPointData);
      }
    });
    return decisionPoints;
  }

  mergeExistingConditionsTableData(experimentInfo: ExperimentVM): FactorialConditionTableRowData[] {
    const existingConditions = experimentInfo.conditions;
    const existingConditionAliases = experimentInfo.conditionAliases;
    const existingDecisionPoints = experimentInfo.partitions;

    const levelOrder = {};
    existingDecisionPoints.forEach((decisionPoint) => {
      decisionPoint.factors.forEach((factor) => {
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

      factorialCondition.levelCombinationElements.sort((a, b) =>
        levelOrder[a.level?.id] > levelOrder[b.level?.id]
          ? 1
          : levelOrder[b.level?.id] > levelOrder[a.level?.id]
          ? -1
          : 0
      );

      const tableRow: FactorialConditionTableRowData = {
        id: factorialCondition.id,
        conditionAliasId: existingConditionAliasId,
        levels: factorialCondition.levelCombinationElements.map((levelElement) => {
          return {
            id: levelElement.level.id,
            name: levelElement.level.name,
          };
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
        name: factorialConditionTableRow.alias,
        conditionCode: factorialConditionTableRow.alias,
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

  checkConditionTableValidity() {
    const tableData = this.getFactorialConditionTableData();
    let sumOfAssignmentWeights = 0.0;
    let negativeweightError = false;

    if (tableData.length > 0) {
      tableData.forEach((factorialConditionTableRow) => {
        sumOfAssignmentWeights += parseFloat(factorialConditionTableRow.weight);
        if (parseFloat(factorialConditionTableRow.weight) < 0) {
          negativeweightError = true;
        }
      });

      // checking if sum is not equal to 100
      if (Math.round(sumOfAssignmentWeights) !== 100.0) {
        return true;
      } else {
        return negativeweightError;
      }
    } else {
      return false;
    }
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
    this.store$.dispatch(experimentDesignStepperAction.actionUpdateFactorialDesignData({ designData }));
  }

  updateFactorialTableData(tableData: FactorialConditionTableRowData[]) {
    this.store$.dispatch(actionUpdateFactorialTableData({ tableData }));
  }

  setUpdateAliasTableEditModeDetails(rowIndex: number | null): void {
    this.store$.dispatch(
      experimentDesignStepperAction.actionUpdateSimpleExperimentAliasTableEditModeDetails({
        simpleExperimentAliasTableEditIndex: rowIndex,
      })
    );
  }

  setDecisionPointTableEditModeDetails(rowIndex: number, rowData: DecisionPointsTableRowData): void {
    this.store$.dispatch(
      experimentDesignStepperAction.actionToggleDecisionPointsTableEditMode({
        decisionPointsTableEditIndex: rowIndex,
        decisionPointsRowData: rowData,
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

  clearDecisionPointTableEditModeDetails(): void {
    this.store$.dispatch(experimentDesignStepperAction.actionClearDecisionPointTableEditDetails());
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

  clearSimpleExperimentDesignStepperData(): void {
    this.store$.dispatch(experimentDesignStepperAction.clearSimpleExperimentDesignStepperData());
  }
}
