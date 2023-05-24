using System.Collections.Generic;
using System.Threading.Tasks;
using Enums;
using Interfaces;
using Newtonsoft.Json;

public static class WorkingGroupClass
{
  public static async Task<WorkingGroup> SetWorkingGroup(
    string url,
    string userId,
    string token,
    string clientSessionId,
    Dictionary<string, string> workingGroup)
  {
    var response = await FetchDataServiceClass.FetchDataService(
        url,
        token,
        clientSessionId,
        new { id = userId, workingGroup },
        REQUEST_TYPES.PATCH
    );
    if (response.status)
    {
      var responseData = JsonConvert.DeserializeObject<WorkingGroup>(response.data.ToString());
      return responseData as WorkingGroup;
    }
    else
    {
      throw new Exception(JsonConvert.SerializeObject(response.message));
    }
  }
}

