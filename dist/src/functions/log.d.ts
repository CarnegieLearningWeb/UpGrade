import { Interfaces } from '../identifiers';
import { ILogInput } from 'upgrade_types';
export default function log(url: string, userId: string, token: string, value: ILogInput[]): Promise<Interfaces.ILog[]>;
