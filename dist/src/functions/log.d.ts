import { Interfaces } from '../identifiers';
import { ILogInput } from 'upgrade_types';
export default function log(url: string, userId: string, token: string, value: ILogInput[]): Promise<Interfaces.ILog[]>;
/**
 *
 * @param url URL of the host to send the analytics to
 * @param userId id of the user
 * @param token additional token to add to the header
 * @param value data to be sent to the server
 */
export declare function sendAnalytics(url: string, userId: string, token: string, value: ILogInput[]): void;
