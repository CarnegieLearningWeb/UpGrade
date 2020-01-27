export default class DataService {
    private static commonConfig;
    private static experimentConditionData;
    private static interestedExperimentPoints;
    static setConfigData(hostURL: string, user: any): void;
    static setData(property: string, value: any): void;
    static getData(property: string): any;
}
