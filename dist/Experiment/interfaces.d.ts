import { EXPERIMENT_STATE, EXPERIMENT_SEARCH_KEY, EXPERIMENT_SORT_KEY, EXPERIMENT_SORT_AS } from './enums';
export interface IEnrollmentCompleteCondition {
    userCount: number;
    groupCount: number;
}
interface IConditionEnrollmentStats {
    id: string;
    user: number;
    group: number;
}
interface IPartitionEnrollmentStats {
    id: string;
    user: number;
    group: number;
    conditions: IConditionEnrollmentStats[];
}
export interface IExperimentEnrollmentStats {
    id: string;
    users: number;
    group: number;
    userExcluded: number;
    groupExcluded?: number;
    conditions: IConditionEnrollmentStats[];
    partitions: IPartitionEnrollmentStats[];
}
export interface IExperimentAssignment {
    expId: string;
    expPoint: string;
    twoCharacterId: string;
    description: string;
    assignedCondition: {
        conditionCode: string;
        twoCharacterId: string;
        description: string;
    };
}
interface ExperimentCreatedData {
    expId: string;
    expPoint: string;
}
interface ExperimentUpdatedData {
    expId: string;
    expPoint: string;
    diff: string;
}
interface ExperimentStateChangedData {
    expId: string;
    expPoint: string;
    previousState: EXPERIMENT_STATE;
    newState: EXPERIMENT_STATE;
    startOn?: Date;
}
interface ExperimentDeletedData {
    experimentName: string;
}
export declare type AuditLogData = ExperimentCreatedData | ExperimentUpdatedData | ExperimentStateChangedData | ExperimentDeletedData;
export interface IExperimentSearchParams {
    key: EXPERIMENT_SEARCH_KEY;
    string: string;
}
export interface IExperimentSortParams {
    key: EXPERIMENT_SORT_KEY;
    sortAs: EXPERIMENT_SORT_AS;
}
export {};
