import { Interfaces } from './identifiers';
interface UserGroup {
    group?: any;
    workingGroup?: any;
}
export default function init(userId: string, hostUrl: string, groupInfo?: UserGroup): Promise<Interfaces.IResponse>;
export {};
