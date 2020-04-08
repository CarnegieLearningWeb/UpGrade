import { Interfaces } from '../identifiers';
export default function setGroupMembership(url: string, userId: string, group: Map<string, Array<string>>): Promise<Interfaces.IUser>;
