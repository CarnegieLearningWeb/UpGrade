# upgrade_client_lib

JavaScript / TypeScript client library for the [UpGrade](https://upgrade-platform.gitbook.io/upgrade-documentation/6.4/developer-guide/reference/client-libraries/typescript-js) A/B testing platform.

## Installation

```bash
npm install upgrade_client_lib
```

## Quickstart

```typescript
import { UpgradeClient, MARKED_DECISION_POINT_STATUS } from 'upgrade_client_lib';

// 1. Construct the client
const client = new UpgradeClient(
  'user123',               // unique user ID
  'https://your-upgrade-server.com',
  'your-app-context'
);
const decisionPoint = { site: 'homepage', target: 'feature-to-be-tested' };

// 2. Initialize the user
await client.init();

// 3. Get an assignment when user hits the "homepage/feature-to-be-tested"
const assignment = await client.getDecisionPointAssignment(decisionPoint.site, decisionPoint.target);

// 4. Apply the condition's payload. It defaults to the condition code, so code written this way keeps working
//    when someone later gives the experiment custom payloads. It's null when no experiment is assigned here.
const condition = assignment.getPayload()?.value; // e.g. 'control' or 'variant'
if (condition === 'control') { /* use the control flow */ }
if (condition === 'variant') { /* use the variant flow */ }

// 5. Mark that the user passed through the decision point to track or officially enroll the user.
//    Marking through the assignment always sends its condition code, whatever its payload is.
await assignment.markDecisionPoint(MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED);
```

If you mark with `client.markDecisionPoint(site, target, condition, status)` instead, pass the condition **code** (`assignment.getCondition()`), not the payload value. For Thompson Sampling experiments, and group-assigned stratified random sampling ones, the server enrolls the user in the condition whose code matches what you send. A payload value matches nothing, so the user silently isn't enrolled, and their rewards can't be recorded.

`client.markDecisionPoint` also accepts an options object (`{ site, target, condition, status, uniquifier, clientError }`), which avoids relying on argument order. The Java and Python libraries order these arguments differently: Java puts `clientError` before `uniquifier`, and Python takes `condition, status` before `site, target`.

## Caching
Assignments and feature flags are cached for the client's lifetime, with no expiry. Both caches are cleared once the server confirms `init`, `setGroupMembership`, `setWorkingGroup` or `setAltUserIds`, since what a user is assigned can depend on their identity and groups. `setFeatureFlagUserGroupsForSession` also clears the flag cache.

This is best-effort. If a lookup is already in flight when one of those calls completes, its response, which reflects the user's previous groups, can still be cached afterwards. Await these calls before reading assignments or flags, or pass `{ ignoreCache: true }` to `getAllExperimentConditions` / `getAllFeatureFlags` when you can't guarantee that. Also pass it when you need fresh data for any other reason, e.g. an experiment that started on the server after the first fetch.

## Timeouts and retries
The default HTTP client (the browser and node builds):
- **Timeout:** 5 seconds per attempt. In browsers this limits the whole request; in Node it limits connecting and then the gaps between data. It isn't configurable.
- **Retries:** requests that are safe to repeat (`init`, group and working group, aliases, assignments, feature flags) are retried up to **3** times after a network failure, timeout or 5xx response, waiting 300 ms, 600 ms and then 1200 ms. A failing safe request can therefore take about 22 seconds to report. `markDecisionPoint`, `log` and `sendReward` are never retried, because the server doesn't deduplicate them. 4xx responses are never retried.

With the **lite** build, timeouts and retries are up to the HTTP client you provide. Each request's config has `retryable: true` when it's safe to resend.

The Java and Python libraries use different defaults (Java: 3-second timeouts and 1 retry; Python: 5 seconds and no retries). See `clientlibs/TIMEOUT_RETRY_POLICY.md` in the UpGrade repo.

## Documentation

For full API reference, feature flags, logging metrics, and advanced configuration, see the [UpGrade TypeScript/JS client library docs](https://upgrade-platform.gitbook.io/upgrade-documentation/6.4/developer-guide/reference/client-libraries/typescript-js).
