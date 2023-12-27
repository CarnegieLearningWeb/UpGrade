using System;
using ClientLib;
using Enums;
using Interfaces;

namespace MyApp // Note: actual namespace depends on the project name.
{
  internal class Program
  {
    public static async Task Main(string[] args)
    {
      Console.WriteLine("Hello World!!!");

      // UpgradeClient call
      string user = "user10";
      string url = "http://localhost:3030";
      string context = "sub";
      UpgradeClient upgrade = new UpgradeClient(user, url, context);

      // === Init call ===
      User initResponse = await upgrade.Init();
      Console.WriteLine("Init Response completed: {0}", initResponse.id);

      // === Group call ===
      Dictionary<string, string[]> group = new Dictionary<string, string[]> {
        { "class", new string[] { "1", "2" } }
      };
      User groupResponse = await upgrade.SetGroupMembership(group);

      // === WorkingGroup call ===
      Dictionary<string, string> workingGroup = new Dictionary<string, string> {
        { "class", "2" }
      };
      User workingGroupResponse = await upgrade.SetWorkingGroup(workingGroup);

      // === Assign call ===
      ExperimentAssignmentv4[] assignResponse = await upgrade.GetAllExperimentConditions();
      Console.WriteLine("Assign Response completed: {0}, {1}, {2}", assignResponse[0].site, assignResponse[0].target, assignResponse[0].assignedCondition.conditionCode);

      // === GetDecisionPointAssignment call ===
      Assignment singleAssignResponse = await upgrade.GetDecisionPointAssignment(assignResponse[0].site, assignResponse[0].target);
      Console.WriteLine("GetExperimentCondition - conditionCode: {0}", singleAssignResponse.GetCondition());
      Console.WriteLine("GetExperimentCondition - experimentType: {0}", singleAssignResponse.GetExperimentType());
      Console.WriteLine("GetExperimentCondition - experimentType: {0}", singleAssignResponse.GetPayload());

      // === Mark call ===
      MarkExperimentPoint markResponse = await upgrade.MarkExperimentPoint(
        assignResponse[0].site,
        assignResponse[0].target,
        assignResponse[0].assignedCondition.conditionCode,
        MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED
      );
      Console.WriteLine("Mark Response completed: {0}", markResponse);

      // === Log call ===
      LogInput[] log = new LogInput[]
      {
        new LogInput
        {
          timestamp = "Mon Feb 06 2023 11:47:38 GMT+0530 (India Standard Time)",
          metrics = new LogMetrics
          {
            attributes = new Dictionary<string, string> 
            {
              { "totalTimeSeconds", "100"}
            }
          }
        },
      };
      Log[] logResponse = await upgrade.Log(log, false);
      Console.WriteLine("Log Response completed:");

      // === Metric call ===
      AbstractMetric[] metric = new AbstractMetric[2];
      metric[0] = new SingleMetric()
      {
        metric = "fake5",
        datatype = MetricMetaData.CATEGORICAL,
        allowedValues = new object[]
        {
          "GRATUATED", "PROMOTED"
        }
      };
      metric[1] = new GroupMetric()
      {
        groupClass = "mastery7",
          allowedKeys = new string[]
          {
            "work1", "work2"
          },
          attributes = new SingleMetric[]
          {
            new SingleMetric
            {
              metric = "fake6",
              datatype = MetricMetaData.CATEGORICAL,
              allowedValues = new object[]
              {
                "GRATUATED", "PROMOTED"
              }
            }
          }
      };
      Metric[] metricResponse = await upgrade.AddMetrics(metric);
      Console.WriteLine("Log Response completed:");
    }
  }
}