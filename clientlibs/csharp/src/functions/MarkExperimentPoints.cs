using System.Collections.Generic;
using System.Threading.Tasks;
using Enums;
using Interfaces;
using Newtonsoft.Json;

public static class MarkExperimentPointClass
{
  public static async Task<MarkExperimentPoint> MarkExperimentPoint(
      string url,
      string userId,
      string token,
      string clientSessionId,
      string site,
      string target,
      string condition,
      MARKED_DECISION_POINT_STATUS status,
      ExperimentAssignmentv4[] getAllData,
      string clientError = null)
  {
    var data = Array.Find(getAllData, d => d.site == site && d.target == target && d.assignedCondition.conditionCode == condition);

    var requestBody = new MarkData
    {
      userId = userId,
      status = status,
      data = data,
      clientError = clientError
    };

    var response = await FetchDataServiceClass.FetchDataService(
        url,
        token,
        clientSessionId,
        requestBody,
        REQUEST_TYPES.POST
    );

    if (response.status)
    {
      var responseData = JsonConvert.DeserializeObject<MarkExperimentPoint>(response.data.ToString());
      return responseData as MarkExperimentPoint;
    }
    else
    {
      throw new Exception(JsonConvert.SerializeObject(response.message));
    }
  }
}