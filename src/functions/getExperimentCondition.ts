import { IExperimentAssignment } from 'ees_types';

export default function getExperimentCondition(experimentConditionData: IExperimentAssignment[], experimentPoint: string, partitionId?: string): IExperimentAssignment {
  try {
    if (experimentConditionData) {
      const result = experimentConditionData.filter(data =>
        partitionId ? (data.name === partitionId && data.point === experimentPoint) : (data.point === experimentPoint && !data.name)
      );

      return result.length ? result[0] : null;
    } else {
      return null;
    }
  } catch (error) {
    throw new Error(error);
  }
}
