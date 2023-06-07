import { INewExperimentAssignment } from 'upgrade_types';

export default function getExperimentCondition(
  experimentConditionData: INewExperimentAssignment[],
  experimentPoint: string,
  partitionId?: string
): INewExperimentAssignment {
  try {
    if (experimentConditionData) {
      const result = experimentConditionData.filter((data) =>
        partitionId
          ? data.target === partitionId && data.site === experimentPoint
          : data.site === experimentPoint && !data.target
      );

      return result.length ? result[0] : null;
    } else {
      return null;
    }
  } catch (error) {
    throw new Error(error);
  }
}
