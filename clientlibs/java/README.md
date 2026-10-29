# educational-experiment-service-java-client-libs

Make a new instance of ExperimentClient class by passing `userId, context, authToken, baseUrl`.
> ExperimentClient experimentClient = new ExperimentClient(userId , context, authToken , baseUrl);

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

> getAllExperimentCondition(callback)

## getExperimentCondition
Returns the Experiment Condition for the partition and point received from the getAllExperimentConditions for the initialized user

> getExperimentCondition(String experimentPoint, callback)

> getExperimentCondition(String experimentPoint,  String experimentId, callback)

## markDecisionPoint
Use this function to record that the user encountered a decision point. Pass `null` as the condition (with `MarkedDecisionPointStatus.NO_CONDITION_ASSIGNED`) when no experiment is running there.

> markDecisionPoint(String site, String condition, MarkedDecisionPointStatus status, callback)

> markDecisionPoint(String site, String target, String condition, MarkedDecisionPointStatus status, callback)

> markDecisionPoint(String site, String target, String condition, MarkedDecisionPointStatus status, String clientError, String uniquifier, callback)

There are also overloads without `target`, with only `clientError`, and taking a `MarkExperimentRequestData`. An `Assignment` from `getExperimentCondition` can mark itself with `assignment.markDecisionPoint(status, [clientError,] [uniquifier,] callback)`; with a single string argument it's the uniquifier.

**Argument order differs from the JS and Python libraries.** In Java, `clientError` comes *before* `uniquifier`; JS and Python take `uniquifier` first, and Python also takes `condition, status` before `site`. Both are plain strings, so swapping them compiles but sends each value in the other's field.

| Library | Client-level mark | Assignment mark |
|---|---|---|
| Java | `(site, [target,] condition, status, [clientError, [uniquifier,]] cb)` | `(status, [clientError,] [uniquifier,] cb)` |
| JS | `(site, target, condition, status, uniquifier?, clientError?)`, or an options object | `(status, uniquifier?, clientError?)` |
| Python | `(condition, status, site, target="", uniquifier="", client_error="")` | `(status, uniquifier="", client_error="")` |

## failedExperimentPoint

Use this function to report failure with given reason

> failedExperimentPoint(String experimentPoint, callback)

> failedExperimentPoint(String experimentPoint, String experimentId, callback)

> failedExperimentPoint(String experimentPoint, String experimentId, String reason, callback)

## log
Use this function to log data

> log(String key, Object value, callback)

## sendRewardForExperiment / sendRewardForDecisionPoint
Use these functions to send a binary reward (`BinaryRewardValue.SUCCESS` / `FAILURE`) for an adaptive experiment, identified either by experiment id or by context + decision point. The context is passed explicitly; it is not filled in from the client's own context.

> sendRewardForExperiment(BinaryRewardValue rewardValue, String experimentId, callback)

> sendRewardForDecisionPoint(BinaryRewardValue rewardValue, String context, String site, String target, callback)

By default the server queues the reward and responds immediately (`mode` = `"accepted"`). Pass `awaitResult = true` (an extra `boolean` before the callback, on either method) to wait until it is recorded (`mode` = `"processed"`). A reward that can't be recorded is then reported to `onError` as a 409.

## setFeatureFlagUserGroupsForSession / clearFeatureFlagUserGroupsForSession
Use these functions to evaluate feature flags against session-scoped groups. When `includeStoredUserGroups` is true the groups are merged with the user's stored groups; when false they replace them. Both clear the cached feature flags.

> setFeatureFlagUserGroupsForSession(Map<String, List<String>> groupsForSession, boolean includeStoredUserGroups)

> clearFeatureFlagUserGroupsForSession()

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

		ExperimentClient experimentClient = new ExperimentClient( userId , appContext, authToken , baseUrl);

		experimentClient.getExperimentCondition("Workspace1", new ResponseCallback<GetExperimentCondition>() {

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

