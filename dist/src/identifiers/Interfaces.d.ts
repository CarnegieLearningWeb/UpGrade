export declare namespace Interfaces {
    interface IConfig {
        hostURL: string;
        user: {
            userId: string;
            userEnvironment: any;
        };
        api: any;
    }
    interface IResponse {
        status: boolean;
        data?: any;
        message?: any;
    }
}
