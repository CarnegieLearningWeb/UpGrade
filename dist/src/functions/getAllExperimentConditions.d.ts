import { IExperimentAssignment } from 'upgrade_types';
export default function getAllExperimentConditions(url: string, userId: string, token: string, context: string): Promise<IExperimentAssignment[]>;
