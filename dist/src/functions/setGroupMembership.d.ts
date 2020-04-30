import { Interfaces } from '../identifiers';
export default function setGroupMembership(url: string, userId: string, token: string, group: Map<string, Array<string>>): Promise<Interfaces.IUser>;
