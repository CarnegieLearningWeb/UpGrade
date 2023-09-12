import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { AppState } from '../core.state';
import { ASSIGNMENT_UNIT } from 'upgrade_types';
import {
  ExperimentDecisionPoint,
  ExperimentCondition,
  ExperimentConditionPayload,
  ExperimentVM,
} from '../experiments/store/experiments.model';
import * as experimentDesignStepperAction from './store/experiment-design-stepper.actions';
import {
  selectIsFormLockedForEdit,
  selecthasExperimentStepperDataChanged,
  selectIsSimpleExperimentPayloadTableEditMode,
  selectSimpleExperimentPayloadTableEditIndex,
  selectSimpleExperimentPayloadTableData,
  selectSimpleExperimentDesignData,
  selectIsDecisionPointsTableEditMode,
  selectDecisionPointsTableEditIndex,
  selectDecisionPointsEditModePreviousRowData,
  selectIsConditionsTableEditMode,
  selectConditionsTableEditIndex,
  selectConditionsEditModePreviousRowData,
  selectIsFactorialConditionsTableEditMode,
  selectFactorialConditionsTableEditIndex,
  selectFactorialConditionsEditModePreviousRowData,
  selectFactorialConditionTableData,
  selectFactorialDesignData,
  selectIsFactorialFactorsTableEditMode,
  selectFactorialFactorsTableEditIndex,
  selectFactorialFactorsEditModePreviousRowData,
  selectIsFactorialLevelsTableEditMode,
  selectFactorialLevelsTableEditIndex,
  selectFactorialLevelsEditModePreviousRowData,
  selectFactorialFactorsTableIndex,
  selectFactorialLevelDesignData,
  selectFactorialFactorDesignData,
} from './store/experiment-design-stepper.selectors';
import {
  SimpleExperimentDesignData,
  ExperimentConditionPayloadRequestObject,
  ExperimentFactorialDesignData,
  FactorialConditionRequestObject,
  DecisionPointsTableRowData,
  ConditionsTableRowData,
  SimpleExperimentPayloadTableRowData,
  FactorialConditionTableRowData,
  FactorLevelData,
  FactorialFactorTableRowData,
  FactorialLevelTableRowData,
  ExperimentFactorData,
} from './store/experiment-design-stepper.model';
import {
  actionUpdateFactorialConditionTableData,
  actionUpdateSimpleExperimentPayloadTableData,
} from './store/experiment-design-stepper.actions';
import { BehaviorSubject, distinctUntilChanged } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import isEqual from 'lodash.isequal';
import { PAYLOAD_TYPE } from '../../../../../../../types/src';

@Injectable({
  providedIn: 'root',
})
export class ExperimentDesignStepperService {
  expStepperDataChangedFlag = false;
  isFormLockedForEdit$ = this.store$.pipe(select(selectIsFormLockedForEdit));
  hasExperimentStepperDataChanged$ = this.store$.pipe(select(selecthasExperimentStepperDataChanged));

  simpleExperimentDesignData$ = this.store$.pipe(
    select(selectSimpleExperimentDesignData),
    distinctUntilChanged(isEqual)
  );
  factorialExperimentDesignData$ = this.store$.pipe(select(selectFactorialDesignData), distinctUntilChanged(isEqual));

  // Unit of Assignment:
  private assignmentUnitSource = new BehaviorSubject<ASSIGNMENT_UNIT>(ASSIGNMENT_UNIT.INDIVIDUAL);
  currentAssignmentUnit$ = this.assignmentUnitSource.asObservable();

  // Payload table:
  simpleExperimentPayloadTableDataBehaviorSubject$ = new BehaviorSubject<SimpleExperimentPayloadTableRowData[]>([]);
  isSimpleExperimentPayloadTableEditMode$ = this.store$.pipe(select(selectIsSimpleExperimentPayloadTableEditMode));
  simpleExperimentPayloadTableEditIndex$ = this.store$.pipe(select(selectSimpleExperimentPayloadTableEditIndex));
  simpleExperimentPayloadTableData$ = this.store$.pipe(
    select(selectSimpleExperimentPayloadTableData),
    distinctUntilChanged(isEqual)
  );

  // Decision Table
  isDecisionPointsTableEditMode$ = this.store$.pipe(select(selectIsDecisionPointsTableEditMode));
  decisionPointsTableEditIndex$ = this.store$.pipe(select(selectDecisionPointsTableEditIndex));
  decisionPointsEditModePreviousRowData$ = this.store$.pipe(select(selectDecisionPointsEditModePreviousRowData));

  // Conditions Table
  isConditionsTableEditMode$ = this.store$.pipe(select(selectIsConditionsTableEditMode));
  conditionsTableEditIndex$ = this.store$.pipe(select(selectConditionsTableEditIndex));
  conditionsEditModePreviousRowData$ = this.store$.pipe(select(selectConditionsEditModePreviousRowData));

  // Factorial Conditions Table
  factorialConditionTableDataBehaviorSubject$ = new BehaviorSubject<FactorialConditionTableRowData[]>([]);
  isFactorialConditionsTableEditMode$ = this.store$.pipe(select(selectIsFactorialConditionsTableEditMode));
  factorialConditionsTableEditIndex$ = this.store$.pipe(select(selectFactorialConditionsTableEditIndex));
  factorialConditionsEditModePreviousRowData$ = this.store$.pipe(
    select(selectFactorialConditionsEditModePreviousRowData)
  );
  factorialConditionTableData$ = this.store$.pipe(
    select(selectFactorialConditionTableData),
    distinctUntilChanged(isEqual)
  );

  // Factor Table
  factorialFactorTableDataBehaviorSubject$ = new BehaviorSubject<FactorialFactorTableRowData[]>([]);
  isFactorialFactorsTableEditMode$ = this.store$.pipe(select(selectIsFactorialFactorsTableEditMode));
  factorialFactorsTableEditIndex$ = this.store$.pipe(select(selectFactorialFactorsTableEditIndex));
  factorialFactorsTableIndex$ = this.store$.pipe(select(selectFactorialFactorsTableIndex));
  factorialFactorsEditModePreviousRowData$ = this.store$.pipe(select(selectFactorialFactorsEditModePreviousRowData));
  factorialFactorTableData$ = this.store$.pipe(select(selectFactorialFactorDesignData), distinctUntilChanged(isEqual));

  // Level Table
  factorialLevelTableDataBehaviorSubject$ = new BehaviorSubject<FactorialLevelTableRowData[]>([]);
  isFactorialLevelsTableEditMode$ = this.store$.pipe(select(selectIsFactorialLevelsTableEditMode));
  factorialLevelsTableEditIndex$ = this.store$.pipe(select(selectFactorialLevelsTableEditIndex));
  factorialLevelsEditModePreviousRowData$ = this.store$.pipe(select(selectFactorialLevelsEditModePreviousRowData));
  factorialLevelsTableData$ = this.store$.pipe(select(selectFactorialLevelDesignData), distinctUntilChanged(isEqual));

  constructor(private store$: Store<AppState>) {
    this.hasExperimentStepperDataChanged$.subscribe(
      (isDataChanged) => (this.expStepperDataChangedFlag = isDataChanged)
    );
    this.factorialConditionTableData$.subscribe(this.factorialConditionTableDataBehaviorSubject$);
    this.simpleExperimentPayloadTableData$.subscribe(this.simpleExperimentPayloadTableDataBehaviorSubject$);
    this.factorialFactorTableData$.subscribe(this.factorialFactorTableDataBehaviorSubject$);
    this.factorialLevelsTableData$.subscribe(this.factorialLevelTableDataBehaviorSubject$);
  }

  changeAssignmentUnit(unit: ASSIGNMENT_UNIT) {
    this.assignmentUnitSource.next(unit);
  }

  getHasExperimentDesignStepperDataChanged() {
    return this.expStepperDataChangedFlag;
  }

  getFactorialConditionTableData() {
    return [...this.factorialConditionTableDataBehaviorSubject$.getValue()];
  }

  getSimpleExperimentPayloadTableData() {
    return [...this.simpleExperimentPayloadTableDataBehaviorSubject$.getValue()];
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

  trimFactorialConditionName(factorialConditionName: string) {
    let trimmedFactorialConditionName = '';
    if (factorialConditionName) {
      trimmedFactorialConditionName = factorialConditionName.split(';')[0].split('=')[1];
      for (let i = 1; i < factorialConditionName.split(';').length; i++) {
        const levelName = factorialConditionName.split(';')[i].split('=')[1];
        trimmedFactorialConditionName = `${trimmedFactorialConditionName}; ${levelName}`;
      }
    }
    return trimmedFactorialConditionName;
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

  setNewSimpleExperimentPayloadTableData(tableData: SimpleExperimentPayloadTableRowData[]) {
    this.store$.dispatch(actionUpdateSimpleExperimentPayloadTableData({ tableData }));
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

  updateAndStorePayloadTableData(
    decisionPoints: ExperimentDecisionPoint[],
    conditions: ExperimentCondition[],
    preexistingPayloadRowData: SimpleExperimentPayloadTableRowData[]
  ): void {
    const payloadTableData = this.createPayloadTableData(decisionPoints, conditions, preexistingPayloadRowData);

    this.setNewSimpleExperimentPayloadTableData(payloadTableData);
  }

  createPayloadTableDataForViewExperiment(experiment: ExperimentVM) {
    const decisionPoints = experiment.partitions;
    const conditions = experiment.conditions;
    const conditionPayloads = experiment.conditionPayloads || [];
    const conditionPayloadsRowData = this.getExistingConditionPayloadRowData(conditionPayloads);
    const payloadTableData = this.createPayloadTableData(decisionPoints, conditions, conditionPayloadsRowData);

    return payloadTableData;
  }

  createPayloadTableData(
    decisionPoints: ExperimentDecisionPoint[],
    conditions: ExperimentCondition[],
    preexistingPayloadRowData: SimpleExperimentPayloadTableRowData[]
  ): SimpleExperimentPayloadTableRowData[] {
    const payloadTableData: SimpleExperimentPayloadTableRowData[] = [];
    decisionPoints.forEach((decisionPoint, index) => {
      conditions.forEach((condition) => {
        // check if a condition payload exists for this decision point + condition combo
        const existingPayload = this.matchPreexistingPayloadData({
          preexistingPayloadRowData,
          decisionPoint,
          condition,
        });

        // assign a reference back to the decision point and condition rows if not an existingPayload
        const designTableCombinationId = existingPayload?.designTableCombinationId || decisionPoint.id + condition.id;

        const payload = existingPayload?.useCustom ? existingPayload.payload : condition.conditionCode;

        const payloadTableDataRow = {
          id: existingPayload?.id,
          designTableCombinationId,
          site: decisionPoint.site,
          target: decisionPoint.target,
          condition: condition.conditionCode,
          payload,
          rowStyle: index % 2 === 0 ? 'even' : 'odd',
          useCustom: existingPayload?.useCustom || false,
        };

        payloadTableData.push(payloadTableDataRow);
      });
    });

    return payloadTableData;
  }

  matchPreexistingPayloadData({
    preexistingPayloadRowData,
    decisionPoint,
    condition,
  }): SimpleExperimentPayloadTableRowData {
    let existingPayload: SimpleExperimentPayloadTableRowData = null;

    existingPayload = preexistingPayloadRowData.find(
      (payload: SimpleExperimentPayloadTableRowData) =>
        payload.designTableCombinationId === decisionPoint.id + condition.id
    );

    return existingPayload;
  }

  getExistingConditionPayloadRowData(
    preexistingConditionPayloadData: ExperimentConditionPayload[]
  ): SimpleExperimentPayloadTableRowData[] {
    const currentPayloadTableData = this.getSimpleExperimentPayloadTableData();

    if (preexistingConditionPayloadData.length) {
      const payloadTableData = this.mapPreexistingConditionPayloadsToTableData(preexistingConditionPayloadData);
      return payloadTableData;
    }

    if (currentPayloadTableData.length) {
      return currentPayloadTableData;
    }

    return [];
  }

  mapPreexistingConditionPayloadsToTableData(
    conditionPayloads: ExperimentConditionPayload[]
  ): SimpleExperimentPayloadTableRowData[] {
    return conditionPayloads.map((conditionPayload) => {
      return {
        id: conditionPayload.id,
        designTableCombinationId: conditionPayload.decisionPoint.id + conditionPayload.parentCondition.id,
        site: conditionPayload.decisionPoint.site,
        target: conditionPayload.decisionPoint.target,
        condition: conditionPayload.parentCondition.conditionCode,
        payload: conditionPayload.payload.value,
        useCustom: conditionPayload.payload.value !== conditionPayload.parentCondition.conditionCode,
      };
    });
  }

  createExperimentConditionPayloadRequestObject({
    decisionPoints,
    conditions,
  }): ExperimentConditionPayloadRequestObject[] {
    const conditionPayloads: ExperimentConditionPayloadRequestObject[] = [];
    const payloadTableData = this.getSimpleExperimentPayloadTableData();

    payloadTableData.forEach((payloadRowData: SimpleExperimentPayloadTableRowData) => {
      // if no custom payload, return early, do not add to array to send to backend
      if (payloadRowData.payload === payloadRowData.condition) {
        return;
      }

      const parentCondition = conditions.find((condition) => condition.conditionCode === payloadRowData.condition);

      const decisionPoint = decisionPoints.find(
        (decisionPoint) => decisionPoint.target === payloadRowData.target && decisionPoint.site === payloadRowData.site
      );

      conditionPayloads.push({
        id: payloadRowData.id || uuidv4(),
        payload: { type: PAYLOAD_TYPE.STRING, value: payloadRowData.payload },
        parentCondition: parentCondition.id,
        decisionPoint: decisionPoint.id,
      });
    });

    return conditionPayloads;
  }

  createNewFactorialConditionTableData(designData: ExperimentFactorialDesignData): FactorialConditionTableRowData[] {
    const tableData: FactorialConditionTableRowData[] = [];
    const requiredFactorialTableData = this.factorDataToConditions(designData.factors);

    requiredFactorialTableData.map((conditionData) => {
      const conditionLevelsData = this.filterLevelsData(conditionData);
      const conditions = this.createConditionString(conditionData);

      const tableRow: FactorialConditionTableRowData = {
        id: uuidv4(), // TODO: maybe not the right place?
        levels: conditionLevelsData,
        condition: conditions,
        payload: '',
        weight: '0.0',
        include: true,
      };
      tableData.push(tableRow);
    });

    return tableData;
  }

  factorDataToConditions(factorsData: ExperimentFactorData[], levelsCombinationData: FactorLevelData[] = []) {
    // return if no data in factors
    if (factorsData.length === 0) {
      return [levelsCombinationData];
    } else {
      // taking the 1st factor
      const currentFactor = factorsData[0];
      const levelPermutations = [];

      for (let i = 0; i < currentFactor.levels.length; i++) {
        const levelId = currentFactor.levels[i].id;
        const levelName = currentFactor.levels[i].name;
        const payloadObj = currentFactor.levels[i].payload;

        // taking level of current factor and processing on other factors
        const remainingLevelsPermutations = this.factorDataToConditions(factorsData.slice(1), [
          ...levelsCombinationData,
          { factor: currentFactor.name, id: levelId, name: levelName, payload: payloadObj },
        ]);
        levelPermutations.push(...remainingLevelsPermutations);
      }
      return levelPermutations;
    }
  }

  filterLevelsData(conditionData: FactorLevelData[]) {
    const levels: FactorialLevelTableRowData[] = [];
    conditionData.forEach((level) => {
      levels.push({ id: level.id, name: level.name, payload: level.payload });
    });
    return levels;
  }

  createConditionString(conditionData: FactorLevelData[]) {
    let alias = '';
    conditionData.forEach((level, index) => {
      if (index == 0) {
        alias = `${level.factor}=${level.name}`;
      } else {
        alias = `${alias}; ${level.factor}=${level.name}`;
      }
    });
    return alias;
  }

  mergeExistingConditionsTableData(experimentInfo: ExperimentVM): FactorialConditionTableRowData[] {
    const existingConditions = experimentInfo.conditions;
    const existingConditionPayloads = experimentInfo.conditionPayloads;
    const existingFactors = experimentInfo.factors;

    const levelOrder = {};
    existingFactors.forEach((factor) => {
      factor.levels.forEach((level) => {
        levelOrder[level.id] = factor.order;
      });
    });

    const tableData = existingConditions.map((factorialCondition) => {
      const conditionPayload = existingConditionPayloads?.find(
        (conditionPayload) => conditionPayload?.parentCondition.id === factorialCondition.id
      );

      const payloadValue = conditionPayload ? conditionPayload.payload.value : '';
      const existingConditionPayloadId = conditionPayload?.id;

      [...factorialCondition.levelCombinationElements].sort((a, b) =>
        levelOrder[a.level?.id] > levelOrder[b.level?.id]
          ? 1
          : levelOrder[b.level?.id] > levelOrder[a.level?.id]
          ? -1
          : 0
      );

      const tableRow: FactorialConditionTableRowData = {
        id: factorialCondition.id,
        conditionPayloadId: existingConditionPayloadId,
        levels: factorialCondition.levelCombinationElements.map((levelElement) => {
          return {
            id: levelElement.level.id,
            name: levelElement.level.name,
            payload: levelElement.level.payload,
          };
        }),
        condition: factorialCondition.conditionCode,
        payload: payloadValue,
        weight: factorialCondition.assignmentWeight.toString(),
        include: factorialCondition.assignmentWeight > 0,
      };
      return tableRow;
    });
    return tableData;
  }

  createFactorialPayloadString(
    factorOneName: string,
    factorOneLevel: string,
    factorTwoName: string,
    factorTwoLevel: string
  ) {
    return `${factorOneName}=${factorOneLevel}; ${factorTwoName}=${factorTwoLevel}`;
  }

  createFactorialConditionRequestObject() {
    const tableData = this.getFactorialConditionTableData();
    const factorialConditionsRequestObject: FactorialConditionRequestObject[] = [];
    let conditionIndex = 1;
    tableData.forEach((factorialConditionTableRow) => {
      factorialConditionsRequestObject.push({
        id: factorialConditionTableRow.id,
        name: factorialConditionTableRow.condition,
        conditionCode: factorialConditionTableRow.condition,
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

  createFactorialConditionsConditionPayloadsRequestObject() {
    const tableData = this.getFactorialConditionTableData();
    const factorialConditionPayloadsRequestObject = [];

    tableData.forEach((factorialConditionTableRow) => {
      if (factorialConditionTableRow.payload === '' || factorialConditionTableRow.payload === null) {
        return;
      }

      factorialConditionPayloadsRequestObject.push({
        id: factorialConditionTableRow.conditionPayloadId || uuidv4(),
        payload: { type: PAYLOAD_TYPE.STRING, value: factorialConditionTableRow.payload },
        parentCondition: factorialConditionTableRow.id,
      });
    });

    return factorialConditionPayloadsRequestObject;
  }

  updateFactorialDesignData(designData: ExperimentFactorialDesignData) {
    this.store$.dispatch(experimentDesignStepperAction.actionUpdateFactorialExperimentDesignData({ designData }));
  }

  updateFactorialConditionTableData(tableData: FactorialConditionTableRowData[]) {
    this.store$.dispatch(actionUpdateFactorialConditionTableData({ tableData }));
  }

  setUpdatePayloadTableEditModeDetails(rowIndex: number | null, isNgDestroyCall: boolean): void {
    this.store$.dispatch(
      experimentDesignStepperAction.actionToggleSimpleExperimentPayloadTableEditMode({
        simpleExperimentPayloadTableEditIndex: rowIndex,
        isNgDestroyCall: isNgDestroyCall,
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

  setFactorialFactorTableEditModeDetails(rowIndex: number, rowData: FactorialFactorTableRowData): void {
    this.store$.dispatch(
      experimentDesignStepperAction.actionToggleFactorialFactorsTableEditMode({
        factorialFactorsTableEditIndex: rowIndex,
        factorialFactorsRowData: rowData,
      })
    );
  }

  setFactorialFactorTableIndex(rowIndex: number): void {
    this.store$.dispatch(
      experimentDesignStepperAction.actionUpdateFactorialFactorsTableIndex({
        factorialFactorsTableIndex: rowIndex,
      })
    );
  }

  setFactorialLevelTableEditModeDetails(rowIndex: number, rowData: FactorialLevelTableRowData): void {
    this.store$.dispatch(
      experimentDesignStepperAction.actionToggleFactorialLevelsTableEditMode({
        factorialLevelsTableEditIndex: rowIndex,
        factorialLevelsRowData: rowData,
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

  clearFactorialFactorTableEditModeDetails(): void {
    this.store$.dispatch(experimentDesignStepperAction.actionClearFactorialFactorTableEditDetails());
  }

  clearFactorialLevelTableEditModeDetails(): void {
    this.store$.dispatch(experimentDesignStepperAction.actionClearFactorialLevelTableEditDetails());
  }

  clearFactorialDesignStepperData(): void {
    this.store$.dispatch(experimentDesignStepperAction.clearFactorialDesignStepperData());
  }

  clearSimpleExperimentDesignStepperData(): void {
    this.store$.dispatch(experimentDesignStepperAction.clearSimpleExperimentDesignStepperData());
  }
}
