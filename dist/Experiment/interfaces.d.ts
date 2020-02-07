import { EXPERIMENT_STATE } from './enums';
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
interface ExperimentCreatedData {
    experimentId: string;
}
interface ExperimentUpdatedData {
    experimentId: string;
    diff: string;
}
interface ExperimentStateChangedData {
    experimentId: string;
    previousState: EXPERIMENT_STATE;
    newState: EXPERIMENT_STATE;
}
interface ExperimentDeletedData {
    experimentName: string;
}
export declare type AuditLogData = ExperimentCreatedData | ExperimentUpdatedData | ExperimentStateChangedData | ExperimentDeletedData;
export {};
