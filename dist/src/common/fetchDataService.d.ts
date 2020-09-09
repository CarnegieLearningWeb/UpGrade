import { Interfaces, Types } from '../identifiers';
export default function fetchDataService(url: string, token: string, data: any, requestType: Types.REQUEST_TYPES, sendAsAnalytics?: boolean): Promise<Interfaces.IResponse>;
