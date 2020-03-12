import { Interfaces } from 'identifiers';

export default class DataService {
  private static commonConfig: Interfaces.IConfig = {
    hostURL: null,
    userId: null,
    api: {
      getAllExperimentConditions: null,
      markExperimentPoint: null,
      setGroupMemberShip: null,
      setWorkingGroup: null
    }
  };
  private static experimentConditionData = null;
  private static interestedExperimentPoints = null;
  private static userGroups = null;
  private static workingGroup = null;

  // Used to set common configuration
  public static setConfigData(userId: string, hostURL: any) {
    DataService.commonConfig = {
      hostURL,
      userId,
      api: {
        init: `${hostURL}/api/init`,
        getAllExperimentConditions: `${hostURL}/api/assign`,
        markExperimentPoint: `${hostURL}/api/mark`,
        setGroupMemberShip: `${hostURL}/api/groupmembership`,
        setWorkingGroup: `${hostURL}/api/workinggroup`
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