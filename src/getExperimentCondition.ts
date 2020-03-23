import DataService from './common/dataService';
import { Interfaces } from './identifiers';

export default function getExperimentCondition(experimentPoint: string, partitionId?: string): Interfaces.IGetExperimentCondition {
  try {
    const experimentConditionData = DataService.getData('experimentConditionData');
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
