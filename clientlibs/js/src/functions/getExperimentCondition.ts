import { IExperimentAssignment } from 'upgrade_types';

export default function getExperimentCondition(
  experimentConditionData: IExperimentAssignment[],
  site: string,
  target?: string
): IExperimentAssignment {
  try {
    if (experimentConditionData) {
      const result = experimentConditionData.filter((data) =>
        target ? data.target === target && data.site === site : data.site === site && !data.target
      );

      return result.length ? result[0] : null;
    } else {
      return null;
    }
  } catch (error) {
    throw new Error(error);
  }
}
