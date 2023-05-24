using System.Collections.Generic;
using System.Threading.Tasks;
using Enums;
using Interfaces;
using Newtonsoft.Json;

public class Assignment
{
  private string _conditionCode;
  private PAYLOAD_TYPE _payloadType;
  private string _payloadValue;
  private EXPERIMENT_TYPE _experimentType;
  private Dictionary<string, AssignedFactor> _assignedFactor;

  public Assignment(string conditionCode, Payload payload = null, Dictionary<string, AssignedFactor> assignedFactor = null)
  {
    _conditionCode = conditionCode;
    _payloadType = payload?.type ?? PAYLOAD_TYPE.STRING;
    _payloadValue = payload?.value;
    _experimentType = assignedFactor != null ? EXPERIMENT_TYPE.FACTORIAL : EXPERIMENT_TYPE.SIMPLE;
    _assignedFactor = assignedFactor;
  }

  public string GetCondition()
  {
    return _conditionCode;
  }

  public Payload GetPayload()
  {
    return _payloadValue != null ? new Payload { type = _payloadType, value = _payloadValue } : null;
  }

  public EXPERIMENT_TYPE GetExperimentType()
  {
    return _experimentType;
  }

  public string[] Factors
  {
    get
    {
      return _experimentType == EXPERIMENT_TYPE.FACTORIAL ? new List<string>(_assignedFactor.Keys).ToArray() : null;
    }
  }

  public string GetFactorLevel(string factor)
  {
    if (_experimentType == EXPERIMENT_TYPE.FACTORIAL)
    {
      return _assignedFactor.ContainsKey(factor) ? _assignedFactor[factor].level : null;
    }
    else
    {
      return null;
    }
  }

  public Payload? GetFactorPayload(string factor)
  {
    if (_experimentType == EXPERIMENT_TYPE.FACTORIAL)
    {
      return _assignedFactor.ContainsKey(factor) && _assignedFactor[factor].payload.value != null
          ? new Payload { type = _assignedFactor[factor].payload.type, value = _assignedFactor[factor].payload.value }
          : null;
    }
    else
    {
      return null;
    }
  }
}

public static class GetExperimentConditionClass
{
  public static Assignment GetExperimentCondition(ExperimentAssignmentv4[] experimentConditionData, string site, string target)
  {
    if (experimentConditionData != null)
    {
      var result = experimentConditionData.FirstOrDefault(data => data.target == target && data.site == site);

      if (result != null)
      {
        var assignment = new Assignment(result.assignedCondition.conditionCode, result.assignedCondition.payload, result.assignedFactor);
        return assignment;
      }
    }

    return null;
  }
}
