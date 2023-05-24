using System.Collections.Generic;
using System.Threading.Tasks;
using Enums;
using Interfaces;
using Newtonsoft.Json;

public static class GroupClass
{
  public static async Task<Group> SetGroupMembership(
    string url,
    string userId,
    string token,
    string clientSessionId,
    Dictionary<string, string[]> group)
  {
    var response = await FetchDataServiceClass.FetchDataService(
        url,
        token,
        clientSessionId,
        new { id = userId, group },
        REQUEST_TYPES.PATCH
    );
    if (response.status)
    {
      var responseData = JsonConvert.DeserializeObject<Group>(response.data.ToString());
      return responseData as Group;
    }
    else
    {
      throw new Exception(JsonConvert.SerializeObject(response.message));
    }
  }
}

