export default class DataService {
    private static commonConfig;
    private static experimentConditionData;
    private static group;
    private static workingGroup;
    static setConfigData(userId: string, hostURL: any): void;
    static setData(property: string, value: any): void;
    static getData(property: string): any;
}
