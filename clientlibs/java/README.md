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
Returns the `Assignment` for a decision point, from the assignments fetched by `getAllExperimentConditions`. `site` and `target` are matched exactly (case-sensitive), as the server matches them.

> getExperimentCondition(String site, callback)

> getExperimentCondition(String site, String target, callback)

Apply the condition's **payload**, not its code: the payload defaults to the condition code, so code written this way keeps working when someone later gives the experiment custom payloads. Then mark through the assignment, which always sends the condition code, whatever its payload is:

```java
Payload payload = assignment.getPayload();
String condition = payload == null ? null : payload.getValue();   // null when no experiment is assigned here
if ("control".equals(condition)) { /* use the control flow */ }
assignment.markDecisionPoint(MarkedDecisionPointStatus.CONDITION_APPLIED, callback);
```

If you mark with `client.markDecisionPoint(site, target, condition, status, callback)` instead, pass the condition **code** (`assignment.getCondition()`), not the payload value. For Thompson Sampling experiments, and group-assigned stratified random sampling ones, the server enrolls the user in the condition whose code matches what you send. A payload value matches nothing, so the user silently isn't enrolled, and their rewards can't be recorded.

When no experiment is assigned at the decision point, `onSuccess` still receives an `Assignment` (it's never `null`): a placeholder whose `getAssignedCondition()`, `getCondition()`, `getPayload()` and `getExperimentType()` are all `null`. Checking that the `Assignment` isn't `null` doesn't help here; use `getPayload()` / `getCondition()`, which return `null` rather than throwing, or null-check `getAssignedCondition()` before chaining on it (`getAssignedCondition().getConditionCode()` throws a `NullPointerException` for the placeholder). A `null` experiment type means no experiment is assigned, since a real assignment always has one. Check it before using it in a `switch`, which throws a `NullPointerException` on `null`. The placeholder can still be marked, e.g. with `MarkedDecisionPointStatus.NO_CONDITION_ASSIGNED`.

The JS library's placeholder is the same except that it reports `SIMPLE` as the type, and the Python library returns `None` instead of a placeholder.

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

## Caching
Assignments and feature flags are cached for the client's lifetime, with no expiry. Both caches are cleared once the server confirms `init`, `setGroupMembership`, `setWorkingGroup` or `setAltUserIds`, since what a user is assigned can depend on their identity and groups. The session-group setters also clear the flag cache.

This is best-effort. If a lookup is already in flight when one of those calls completes, its response, which reflects the user's previous groups, can still be cached afterwards. Wait for these calls' callbacks before reading assignments or flags, or pass `ignoreCache = true` to the `getAllExperimentConditions(boolean, callback)` / `getAllFeatureFlags(boolean, callback)` overloads when you can't guarantee that. Also pass it when you need fresh data for any other reason, e.g. an experiment that started on the server after the first fetch.

## Timeouts and retries
- **Timeout:** 3 seconds to connect and 3 seconds between reads (an idle timeout, not a limit on the whole request). Override with `ClientProperties.CONNECT_TIMEOUT` / `ClientProperties.READ_TIMEOUT` in the constructor's `properties` map.
- **Retries:** requests that are safe to repeat (`init`, group and working group, aliases, assignments, feature flags) are retried **once**, immediately, after a network failure or a 5xx response. `markDecisionPoint`, `log` and the reward calls are never retried, because the server doesn't deduplicate them. 4xx responses are never retried.

The JS and Python libraries use different defaults (5-second timeouts; JS also retries once, but waits 300 ms first, and Python doesn't retry). See `clientlibs/TIMEOUT_RETRY_POLICY.md` in the UpGrade repo.

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

