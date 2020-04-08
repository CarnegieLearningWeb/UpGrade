import { IExperimentAssignment } from 'ees_types';
export default function getAllExperimentConditions(url: string, userId: string, context?: string): Promise<IExperimentAssignment[]>;
