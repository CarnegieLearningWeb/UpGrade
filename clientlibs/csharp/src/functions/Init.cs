using System.Collections.Generic;
using System.Threading.Tasks;
using Enums;
using Interfaces;
using Newtonsoft.Json;

public static class InitClass
{
  public static async Task<User> Init(string url, string userId, string token, string clientSessionId,
      Dictionary<string, List<string>> group = null, Dictionary<string, string> workingGroup = null)
  {
    var data = new Dictionary<string, object>
        {
            { "id", userId }
        };

    if (group != null)
    {
      data.Add("group", group);
    }

    if (workingGroup != null)
    {
      data.Add("workingGroup", workingGroup);
    }

    var response = await FetchDataServiceClass.FetchDataService(url, token, clientSessionId, data, REQUEST_TYPES.POST);

    if (response.status)
    {
      var responseData = JsonConvert.DeserializeObject<User>(response.data.ToString());
      return responseData as User;
    }
    else
    {
      throw new Exception(JsonConvert.SerializeObject(response.message));
    }
  }
}
