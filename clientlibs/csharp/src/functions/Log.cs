using System.Collections.Generic;
using System.Threading.Tasks;
using Enums;
using Interfaces;
using Newtonsoft.Json;

public static class LogClass
{
  public static async Task<Log[]> Log(
    string url,
    string userId,
    string token,
    string clientSessionId,
    LogInput[] value,
    bool sendAsAnalytics = false)
  {
    var data = new
    {
      userId,
      value
    };
    var response = await FetchDataServiceClass.FetchDataService(url, token, clientSessionId, data, REQUEST_TYPES.POST, sendAsAnalytics);
    if (response.status)
    {
      var responseData = JsonConvert.DeserializeObject<Log[]>(response.data.ToString());
      return responseData as Log[];
    }
    else
    {
      throw new Exception(JsonConvert.SerializeObject(response.message));
    }
  }
}
