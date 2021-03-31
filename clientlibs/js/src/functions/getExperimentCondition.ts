import { IExperimentAssignment } from 'upgrade_types';

export default function getExperimentCondition(
  experimentConditionData: IExperimentAssignment[],
  experimentPoint: string,
  partitionId?: string
): IExperimentAssignment {
  try {
    if (experimentConditionData) {
      const result = experimentConditionData.filter((data) =>
        partitionId
          ? data.expId === partitionId && data.expPoint === experimentPoint
          : data.expPoint === experimentPoint && !data.expId
      );

      return result.length ? result[0] : null;
    } else {
      return null;
    }
  } catch (error) {
    throw new Error(error);
  }
}
