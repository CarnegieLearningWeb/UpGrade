import setGroupMembership from './functions/setGroupMembership';
import { Interfaces } from './identifiers';
import setWorkingGroup from './functions/setWorkingGroup';
import getAllExperimentConditions from './functions/getAllExperimentConditions';
import { IExperimentAssignment, IFeatureFlag, ISingleMetric, IGroupMetric, ILogInput } from 'upgrade_types';
import getExperimentCondition from './functions/getExperimentCondition';
import markExperimentPoint from './functions/markExperimentPoint';
import failedExperimentPoint from './functions/failedExperimentPoint';
import getAllFeatureFlags from './functions/getAllfeatureFlags';
import log from './functions/log';
import setAltUserIds from './functions/setAltUserIds';
import addMetrics from './functions/addMetrics';
import getFeatureFlag from './functions/getFeatureFlag';
import init from './functions/init';
import * as uuid  from 'uuid';

export default class UpgradeClient {
    // Endpoints URLs
    private api = {
        init: null,
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
    private hostUrl: string;
    // Use token if it is given in constructor
    private token: string;
    private clientSessionId: string;

    private group: Map<string, Array<string>> = null;
    private workingGroup: Map<string, string> = null;
    private experimentConditionData: IExperimentAssignment[] = null;
    private featureFlags: IFeatureFlag[] = null;

    constructor(userId: string, hostUrl: string, options?: {token?: string, clientSessionId?: string}) {
        this.userId = userId;
        this.hostUrl = hostUrl;
        this.token = options?.token;
        this.clientSessionId = options?.clientSessionId || uuid.v4();
        this.api = {
            init: `${hostUrl}/api/init`,
            getAllExperimentConditions: `${hostUrl}/api/assign`,
            markExperimentPoint: `${hostUrl}/api/mark`,
            setGroupMemberShip: `${hostUrl}/api/groupmembership`,
            setWorkingGroup: `${hostUrl}/api/workinggroup`,
            failedExperimentPoint: `${hostUrl}/api/failed`,
            getAllFeatureFlag: `${hostUrl}/api/featureflag`,
            log: `${hostUrl}/api/log`,
            altUserIds: `${hostUrl}/api/useraliases`,
            addMetrics: `${hostUrl}/api/metric`,
        }
    }

    private validateClient() {
        if (!this.hostUrl) {
            throw new Error('Please set application host URL first.');
        }
        if (!this.userId) {
            throw new Error('Please provide valid user id.');
        }
    }

    async init(group?: Map<string, Array<string>>, workingGroup?: Map<string, string>): Promise<Interfaces.IUser> {
        this.validateClient();
        return await init(this.api.init, this.userId, this.token, this.clientSessionId, group, workingGroup);
    }

    async setGroupMembership(group: Map<string, Array<string>>): Promise<Interfaces.IUser> {
        this.validateClient();
        let response: Interfaces.IUser = await setGroupMembership(this.api.setGroupMemberShip, this.userId, this.token, this.clientSessionId, group);
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
        let response: Interfaces.IUser = await setWorkingGroup(this.api.setWorkingGroup, this.userId, this.token, this.clientSessionId, workingGroup);
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
        const response = await getAllExperimentConditions(this.api.getAllExperimentConditions, this.userId, this.token, this.clientSessionId, context);
        if (Array.isArray(response)) {
            this.experimentConditionData = response;
        }
        return response;
    }

    async getExperimentCondition(context: string, experimentPoint: string, partitionId?: string): Promise<IExperimentAssignment> {
        this.validateClient();
        if (this.experimentConditionData == null) {
            await this.getAllExperimentConditions(context);
        }
        return getExperimentCondition(this.experimentConditionData, experimentPoint, partitionId);
    }

    async markExperimentPoint(experimentPoint: string, condition = null, partitionId?: string): Promise<Interfaces.IMarkExperimentPoint> {
        this.validateClient();
        return await markExperimentPoint(this.api.markExperimentPoint, this.userId, this.token, this.clientSessionId, experimentPoint, condition, partitionId);
    }

    async failedExperimentPoint(experimentPoint: string, reason: string, experimentId?: string): Promise<Interfaces.IFailedExperimentPoint> {
        this.validateClient();
        return await failedExperimentPoint(this.api.failedExperimentPoint, this.token, this.clientSessionId, experimentPoint, reason, this.userId, experimentId);
    }

    async getAllFeatureFlags(): Promise<IFeatureFlag[]> {
        this.validateClient();
        const response = await getAllFeatureFlags(this.api.getAllFeatureFlag, this.token, this.clientSessionId);
        if (response.length) {
            this.featureFlags = response;
        }
        return response;
    }

    getFeatureFlag(key: string): IFeatureFlag {
        this.validateClient();
        return getFeatureFlag(this.featureFlags, key);
    }

    async log(value: ILogInput[], sendAsAnalytics = false): Promise<Interfaces.ILog[]> {
        this.validateClient();
        return await log(this.api.log, this.userId, this.token, this.clientSessionId, value, sendAsAnalytics);
    }

    async setAltUserIds(altUserIds: string[]): Promise<Interfaces.IExperimentUserAliases[]> {
        this.validateClient();
        return await setAltUserIds(this.api.altUserIds, this.userId, this.token, this.clientSessionId, altUserIds);
    }

    async addMetrics(metrics: Array<ISingleMetric | IGroupMetric>): Promise<Interfaces.IMetric[]> {
        this.validateClient();
        return await addMetrics(this.api.addMetrics, this.token, this.clientSessionId, metrics);
    }
}