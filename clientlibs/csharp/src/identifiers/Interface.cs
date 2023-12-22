using Enums;

namespace Interfaces
{
  public class ExperimentAssignmentv4
  {
    public string site { get; set; }
    public string target { get; set; }
    public AssignedCondition assignedCondition { get; set; }
    public Dictionary<string, AssignedFactor> assignedFactor { get; set; }
  }

  public class MarkExperimentPoint
  {
    string id { get; set; }
    string site { get; set; }
    string target { get; set; }
    string userId { get; set; }
    string experimentId { get; set; }
  }

  public class AssignedCondition
  {
    public string conditionCode { get; set; }
    public Payload payload { get; set; }
    public string experimentId { get; set; }
    public string id { get; set; }
  }

  public class AssignedFactor
  {
    public string level { get; set; }
    public Payload payload { get; set; }
  }

  public class IFlagVariation
  {
    string Id { get; set; }
    string Value { get; set; }
    string Name { get; set; }
    string Description { get; set; }
    bool[] DefaultVariation { get; set; }
  }

  public class IFeatureFlag
  {
    string Id { get; set; }
    string Name { get; set; }
    string Key { get; set; }
    string Description { get; set; }
    string VariationType { get; set; }
    bool Status { get; set; }
    IList<IFlagVariation> Variations { get; set; }
  }

  public class LogMetrics
  {
    public Dictionary<string, string> attributes { get; set; }
    public IList<ILogGroupMetrics> groupedMetrics { get; set; }
  }

  public interface ILogGroupMetrics
  {
    string groupClass { get; set; }
    string groupKey { get; set; }
    string groupUniquifier { get; set; }
    IDictionary<string, string> attributes { get; set; }
  }

  public class LogInput
  {
    public string timestamp { get; set; }
    public LogMetrics metrics { get; set; }
  }

  public class GroupMetric : AbstractMetric
  {
    public string groupClass { get; set; }
    public string[] allowedKeys { get; set; }
    public SingleMetric[] attributes { get; set; }
  }

  public class SingleMetric : AbstractMetric
  {
    public string metric { get; set; }
    public string datatype { get; set; }
    public object[] allowedValues { get; set; }
  }

  public class Payload
  {
    public PAYLOAD_TYPE type { get; set; }
    public string value { get; set; }
  }

  public class User
  {
    public string id { get; set; }
    public Dictionary<string, string[]>? group { get; set; }
    public Dictionary<string, string>? workingGroup { get; set; }
  }

  public class Group
  {
    public string id { get; set; }
    public Dictionary<string, string[]>? group { get; set; }
  }

  public class WorkingGroup
  {
    public string id { get; set; }
    public Dictionary<string, string>? workingGroup { get; set; }
  }

  public class Response
  {
    public bool status { get; set; }
    public object data { get; set; }
    public object message { get; set; }
  }

  public class MarkData
  {
    public string userId { get; set; }
    public MARKED_DECISION_POINT_STATUS status { get; set; }
    public ExperimentAssignmentv4 data { get; set; }
    public string clientError { get; set; }
  }

  public class Log
  {
    string id { get; set; }
    object data { get; set; }
    List<Metric> metrics { get; set; }
    User user { get; set; }
    string timeStamp { get; set; }
    string uniquifier { get; set; }
  }

  public class Metric
  {
    string key { get; set; }
    string type { get; set; }
    string[] allowedData { get; set; }
  }

  public class MetricMetaData
  {
    public const string CATEGORICAL = "categorical";
    public const string CONTINUOUS = "continuous";
  }

  public abstract class AbstractMetric
  {

  }
}