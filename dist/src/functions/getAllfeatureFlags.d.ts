import { IFeatureFlag } from 'upgrade_types';
export default function getAllFeatureFlags(url: string, token: string): Promise<IFeatureFlag[]>;
