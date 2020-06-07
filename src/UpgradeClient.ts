import setGroupMembership from './functions/setGroupMembership';
import { Interfaces } from './identifiers';
import setWorkingGroup from './functions/setWorkingGroup';
import getAllExperimentConditions from './functions/getAllExperimentConditions';
import { IExperimentAssignment, IMetricUnit } from 'upgrade_types';
import getExperimentCondition from './functions/getExperimentCondition';
import markExperimentPoint from './functions/markExperimentPoint';
import failedExperimentPoint from './functions/failedExperimentPoint';
import getAllFeatureFlags from './functions/getAllfeatureFlags';
import log from './functions/log';
import setAltUserIds from './functions/setAltUserIds';
import addMetrics from './functions/addMetrics';

export default class UpgradeClient {
    private static hostUrl: string;
    // Endpoints URLs
    private static api = {
        getAllExperimentConditions: null,
        markExperimentPoint: null,
        setGroupMemberShip: null,
        setWorkingGroup: null,
        failedExperimentPoint: null,
        getAllFeatureFlag: null,
        log: null,
        altUserIds: null,
        addMetrics: null,
    };
    private userId: string;
    // Use token if it is given in constructor
    private token: string;

    private group: Map<string, Array<string>> = null;
    private workingGroup: Map<string, string> = null;
    private experimentConditionData: IExperimentAssignment[] = null;

    constructor(userId: string, token: string) {
        this.userId = userId;
        this.token = token;
    }

    static setHostUrl(url: string) {
        this.hostUrl = url;
        this.api = {
            getAllExperimentConditions: `${url}/api/assign`,
            markExperimentPoint: `${url}/api/mark`,
            setGroupMemberShip: `${url}/api/groupmembership`,
            setWorkingGroup: `${url}/api/workinggroup`,
            failedExperimentPoint: `${url}/api/failed`,
            getAllFeatureFlag: `${url}/api/featureflag`,
            log: `${url}/api/log`,
            altUserIds: `${url}/api/useraliases`,
            addMetrics: `${url}/api/metric`,
        }
    }

    private validateClient() {
        if (!UpgradeClient.hostUrl) {
            throw new Error('Please set application host URL first.');
        }
        if (!this.userId) {
            throw new Error('Provided User id is invalid');
        }
        if (!this.token) {
            throw new Error('Provided token is invalid');
        }
    }

    async setGroupMembership(group: Map<string, Array<string>>): Promise<Interfaces.IUser> {
        this.validateClient();
        let response: Interfaces.IUser = await setGroupMembership(UpgradeClient.api.setGroupMemberShip, this.userId, this.token, group);
        if (response.id) {
            // If it does not throw error from setGroupMembership
            this.group = group;
            response = {
                ...response,
                workingGroup: this.workingGroup
            }
        }
        return response;
    }

    async setWorkingGroup(workingGroup: Map<string, string>): Promise<Interfaces.IUser> {
        this.validateClient();
        let response: Interfaces.IUser = await setWorkingGroup(UpgradeClient.api.setWorkingGroup, this.userId, this.token, workingGroup);
        if (response.id) {
            // If it does not throw error from setWorkingGroup
            this.workingGroup = workingGroup;
            response = {
                ...response,
                group: this.group
            }
        }
        return response;
    }

    async getAllExperimentConditions(context: string): Promise<IExperimentAssignment[]> {
        this.validateClient();
        const response = await getAllExperimentConditions(UpgradeClient.api.getAllExperimentConditions, this.userId, this.token, context);
        if (Array.isArray(response)) {
            this.experimentConditionData = response;
        }
        return response;
    }

    getExperimentCondition(experimentPoint: string, partitionId?: string): IExperimentAssignment {
        this.validateClient();
        return getExperimentCondition(this.experimentConditionData, experimentPoint, partitionId);
    }

    async markExperimentPoint(experimentPoint: string, partitionId?: string): Promise<Interfaces.IMarkExperimentPoint> {
        this.validateClient();
        return await markExperimentPoint(UpgradeClient.api.markExperimentPoint, this.userId, this.token, experimentPoint, partitionId);
    }

    async failedExperimentPoint(experimentPoint: string, reason: string, experimentId?: string): Promise<Interfaces.IFailedExperimentPoint> {
        this.validateClient();
        return await failedExperimentPoint(UpgradeClient.api.failedExperimentPoint, this.token, experimentPoint, reason, this.userId, experimentId);
    }
    
    async getAllFeatureFlags(): Promise<Interfaces.FeatureFlag[]> {
        this.validateClient();
        return await getAllFeatureFlags(UpgradeClient.api.getAllFeatureFlag, this.token);
    }

    async log(key: string, value: any): Promise<Interfaces.ILog> {
        this.validateClient();
        return await log(UpgradeClient.api.log, this.userId, this.token, key, value);
    }

    async setAltUserIds(altUserIds: string[]): Promise<Interfaces.IExperimentUser[]> {
        this.validateClient();
        return await setAltUserIds(UpgradeClient.api.altUserIds, this.userId, this.token, altUserIds);
    }

    async addMetrics(metrics: IMetricUnit[]): Promise<Interfaces.IMetric[]> {
        this.validateClient();
        return await addMetrics(UpgradeClient.api.addMetrics, this.token, metrics);
    }
}