import { Interfaces } from 'identifiers';

export default class DataService {
  private static commonConfig: Interfaces.IConfig = {
    hostURL: null,
    user: null,
    api: {
      getAllExperimentConditions: null,
      markExperimentPoint: null
    }
  };
  private static experimentConditionData = null;
  private static interestedExperimentPoints = null;

  // Used to set common configuration
  public static setConfigData(hostURL: string, user: any) {
    DataService.commonConfig = {
      hostURL,
      user,
      api: {
        getAllExperimentConditions: `${hostURL}/api/assign`,
        markExperimentPoint: `${hostURL}/api/mark`
      }
    };
  }

  // Set a value based on property
  public static setData(property: string, value: any) {
    DataService[property] = value;
  }

  // Get value of property
  public static getData(property: string) {
    return DataService[property];
  }
}
