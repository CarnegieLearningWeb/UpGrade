using System.Collections.Generic;
using System.Threading.Tasks;
using Enums;
using Interfaces;
using Newtonsoft.Json;

public static class MetricClass
{
  public static async Task<Metric[]> AddMetrics(
      string url,
      string token,
      string clientSessionId,
      AbstractMetric[] metrics
      )
  {
    var response = await FetchDataServiceClass.FetchDataService(
        url,
        token,
        clientSessionId,
        new { metricUnit = metrics },
        REQUEST_TYPES.POST);
    if (response.status)
    {
      var responseData = JsonConvert.DeserializeObject<Metric[]>(response.data.ToString());
      return responseData as Metric[];
    }
    else
    {
      throw new Exception(JsonConvert.SerializeObject(response.message));
    }
  }
}
