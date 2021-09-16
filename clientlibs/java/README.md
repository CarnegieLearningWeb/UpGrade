# educational-experiment-service-java-client-libs

Make a new instance of ExperimentClient class by passing `userId, authToken, baseUrl`.
> ExperimentClient experimentClient = new ExperimentClient(userId , authToken , baseUrl);

# Functions

## Initialise User
This is the first call from the client lib. It will create the user definition on the server.

To Initialize user with userId
> init(callback)

To Initialize user with userId and student group definition
> init(Map<String, List<String>> group, callback)

To Initialize user with userId, student group definition and student workingGroup definition
> init(Map<String, List<String>> group, Map<String, String> workingGroup, callback)

## setAltUserIds
Set alternative user ids for current user

> setAltUserIds(String[] altUserIds, callback)

## SetGroupMembership
Updates/Set the group membership of the initialized user

> setGroupMembership(HashMap<String, ArrayList<String>> group, callback)


## setWorkingGroup (workingGroup)
Updates/Set the working group of the initialized user

> setWorkingGroup(HashMap<String, String> workingGroup, callback)

## getAllExperimentCondition
Get all the experiment assignments for the initialized user

> getAllExperimentCondition(String context, callback)

## getExperimentCondition
Returns the Experiment Condition for the partition and point received from the getAllExperimentConditions for the initialized user

> getExperimentCondition(String context, String experimentPoint, callback)

> getExperimentCondition(String context, String experimentPoint,  String experimentId, callback)

## markExperimentPoint
Calls markExperimentPoint for experiment point and partitionId. It will use the user definition from initialized user

> markExperimentPoint(String experimentPoint, callback)

> markExperimentPoint(String experimentPoint, String experimentId, callback)

## failedExperimentPoint

Use this function to report failure with given reason

> failedExperimentPoint(String experimentPoint, callback)

> failedExperimentPoint(String experimentPoint, String experimentId, callback)

> failedExperimentPoint(String experimentPoint, String experimentId, String reason, callback)

## log
Use this function to log data

> log(String key, Object value, callback)

## addMetrics
Use this function to add metrics in upgrade system

> addMetrics(MetricUnit[] metrics, callback)

## getAllFeatureFlags
Use this function to get feature flags list

getAllFeatureFlags()

## getFeatureFlag
Use this function to get feature flag matched to given key

getFeatureFlag(String key, callback)

# Example request

```java

 public static void main(String []args) throws InterruptedException
	{
		String baseUrl = "http://upgrade-development.us-east-1.elasticbeanstalk.com/";
		String userId = "user1";

		ExperimentClient experimentClient = new ExperimentClient( userId , authToken , baseUrl);

		experimentClient.getExperimentCondition("appContext", "Workspace1", new ResponseCallback<GetExperimentCondition>() {

			@Override
			public void onSuccess(@NonNull GetExperimentCondition t) {
				System.out.println(" Response: "+ t.getExperimentPoint());
			}

			@Override
			public void onError(@NonNull ErrorResponse error) {
				System.out.println(" Error : "+ error.getType());

			}
		});
	}
```

