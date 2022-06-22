import { InjectionToken } from "@angular/core";

export const ENV = new InjectionToken<Environment>('env.token');

export interface APIEndpoints {
    getAllExperiments: string,
    createNewExperiments: string,
    importExperiment: string, 
    exportExperiment: string,
    updateExperiments: string,
    getExperimentById: string,
    getAllAuditLogs: string,
    getAllErrorLogs: string,
    experimentsStats: string,
    experimentDetailStat: string,
    generateCsv: string,
    experimentGraphInfo: string,
    deleteExperiment: string,
    updateExperimentState: string,
    users: string,
    loginUser: string,
    getAllUsers: string,
    userDetails: string,
    excludeUsers: string,
    excludeGroups: string,
    previewUsers: string,
    getAllPreviewUsers: string,
    previewUsersAssignCondition: string,
    allPartitions: string,
    allExperimentNames: string,
    featureFlag: string,
    updateFlagStatus: string,
    getPaginatedFlags: string,
    setting: string,
    metrics: string,
    metricsSave: string,
    queryResult: string,
    getVersion: string,
    contextMetaData: string,
}

export interface Environment {
    appName: string,
    envName: string
    apiBaseUrl: string
    production: boolean,
    test: boolean,
    i18nPrefix: string,
    appVersion: string,
    gapiClientId: string,
    domainName: string,
    pollingEnabled: boolean,
    pollingInterval: number,
    pollingLimit: number,
    api: APIEndpoints
}