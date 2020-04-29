import setGroupMembership from './functions/setGroupMembership';
import { Interfaces } from './identifiers';
import setWorkingGroup from './functions/setWorkingGroup';
import getAllExperimentConditions from './functions/getAllExperimentConditions';
import { IExperimentAssignment } from 'upgrade_types';
import getExperimentCondition from './functions/getExperimentCondition';
import markExperimentPoint from './functions/markExperimentPoint';
import failedExperimentPoint from './functions/failedExperimentPoint';

export default class UpgradeClient {
    private static hostUrl: string;
    // Endpoints URLs
    private static api = {
        init: null,
        getAllExperimentConditions: null,
        markExperimentPoint: null,
        setGroupMemberShip: null,
        setWorkingGroup: null,
        failedExperimentPoint: null
    };
    private userId: string;
    // Use token if it is given in constructor
    private token: string;

    private group: Map<string, Array<string>> = null;
    private workingGroup: Map<string, string> = null;
    private experimentConditionData: IExperimentAssignment[] = null;

    constructor(userId: string, token?: string) {
        this.userId = userId;
        this.token = token;
    }

    static setHostUrl(url: string) {
        this.hostUrl = url;
        this.api = {
            init: `${url}/api/init`,
            getAllExperimentConditions: `${url}/api/assign`,
            markExperimentPoint: `${url}/api/mark`,
            setGroupMemberShip: `${url}/api/groupmembership`,
            setWorkingGroup: `${url}/api/workinggroup`,
            failedExperimentPoint: `${url}/api/failed`
        }
    }

    private validateClient() {
        if (!UpgradeClient.hostUrl) {
            throw new Error('Please set application host URL first.');
        }
    }

    async setGroupMembership(group: Map<string, Array<string>>): Promise<Interfaces.IUser> {
        this.validateClient();
        let response: Interfaces.IUser = await setGroupMembership(UpgradeClient.api.setGroupMemberShip, this.userId, group);
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
        let response: Interfaces.IUser = await setWorkingGroup(UpgradeClient.api.setWorkingGroup, this.userId, workingGroup);
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
        const response = await getAllExperimentConditions(UpgradeClient.api.getAllExperimentConditions, this.userId, context);
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
        return await markExperimentPoint(UpgradeClient.api.markExperimentPoint, this.userId, experimentPoint, partitionId);
    }

    async failedExperimentPoint(experimentPoint: string, reason: string, experimentId?: string): Promise<Interfaces.IFailedExperimentPoint> {
        this.validateClient();
        return await failedExperimentPoint(UpgradeClient.api.failedExperimentPoint, experimentPoint, reason, experimentId);
    }
}