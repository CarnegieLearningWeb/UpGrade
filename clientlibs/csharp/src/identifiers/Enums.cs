namespace Enums
{
  public enum IMetricMetaData
  {
    CONTINUOUS,
    CATEGORICAL
  }

  public enum PAYLOAD_TYPE
  {
    STRING,
    JSON,
    CSV
  }

  public enum SUPPORTED_CALIPER_PROFILES
  {
    GRADING_PROFILE
  }

  public enum SUPPORTED_CALIPER_EVENTS
  {
    GRADE_EVENT
  }

  public enum REQUEST_TYPES
  {
    GET,
    POST,
    PATCH
  }

  public enum MARKED_DECISION_POINT_STATUS
  {
    CONDITION_APPLIED,
    CONDITION_FAILED_TO_APPLY,
    NO_CONDITION_ASSIGNED
  }

  public enum EXPERIMENT_TYPE
  {
    SIMPLE,
    FACTORIAL
  }
}