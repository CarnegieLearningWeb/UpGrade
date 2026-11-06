# UpGrade v6 Client API Coverage

Which method in each client library (JS, Java, Python) implements each `/api/v6` client endpoint, and which test
covers it. It's the one place that shows whether all three libraries keep up with the API, so a change to a client
endpoint shows up as visible drift instead of a silent bug.

**This file doesn't describe the API itself.** The contract is the backend code:
`packages/backend/src/api/controllers/ExperimentClientController.v6.ts` and its validators in
`packages/backend/src/api/controllers/validators/`. The swagger comments on each handler (served at `/swagger`, and
published per version as the OpenAPI spec in the GitBook docs) are a readable reference, but they're hand-written
and may lag the code.

Two behaviors the client libraries depend on aren't obvious from the validators:
- **`POST /init` rejects unknown body fields** (`forbidNonWhitelisted`) with a 400, where every other client endpoint
  strips them. A library that adds a field to its `/init` request breaks `/init`.
- **`POST /mark` must get the condition code, not a payload value,** in `data.assignedCondition.conditionCode`. For
  Thompson Sampling experiments, and stratified random sampling experiments assigned by group, the server enrolls
  the user in the condition whose code matches, so a payload value silently skips enrollment (and any later rewards
  can't be recorded). Libraries should also send `data.assignedCondition.experimentId` from the cached assignment,
  so the server marks the experiment the user was actually assigned instead of selecting one again.

## Keeping it current

1. **Changing a v6 client endpoint** (path, method, body fields, query parameters, headers or response shape):
   set each library's cell below to `❌` for the part that changed, in the same PR (and update the swagger docs as
   usual).
2. **Implementing it in a client library** (in that PR or a follow-up): set that library's cell back to `✅`, with
   the method and the test that covers it.
3. **Before a client-library release:** every cell should be `✅` or `➖`. Fix any `❌`, or defer it deliberately and
   say so in the release notes.

Client-library behavior that doesn't change the API (caching, retries, timeouts) isn't tracked here; see each
library's README and `TIMEOUT_RETRY_POLICY.md`.

Legend: `✅` implemented and tested · `❌` missing or out of date · `➖` deliberately not supported (with the reason).

## Library coverage

| Endpoint | JS (`UpgradeClient`; tests in `ApiService.spec.ts`) | Java (`ExperimentClient`; tests in `ExperimentClientTest`) | Python (`UpgradeClient`, async + `_sync`; tests in `test_api_service.py`) |
|---|---|---|---|
| `POST /init` | ✅ `init` · `#init` | ✅ `init` (3 overloads) · `initSendsOnlyGroupAndWorkingGroup` | ✅ `init` · `TestInitUser` |
| `PATCH /groupmembership` | ✅ `setGroupMembership` · `#setGroupMembership` | ✅ `setGroupMembership` · `setGroupMembershipPatchesGroup` | ✅ `set_group_membership` · `TestSetGroupMembership` |
| `PATCH /workinggroup` | ✅ `setWorkingGroup` · `#setWorkingGroup` | ✅ `setWorkingGroup` · `setWorkingGroupPatchesWorkingGroup` | ✅ `set_working_group` · `TestSetWorkingGroup` |
| `PATCH /useraliases` | ✅ `setAltUserIds` · `#setAltUserIds` | ✅ `setAltUserIds` · `setAltUserIdsPatchesAliases` | ✅ `set_alt_user_ids` · `TestSetAltUserIds` |
| `POST /assign` | ✅ `getAllExperimentConditions`, `getDecisionPointAssignment` · `#getAllExperimentConditions` | ✅ `getAllExperimentConditions`, `getExperimentCondition` · `getAllExperimentConditionsPostsContext` | ✅ `get_all_experiment_conditions`, `get_decision_point_assignment` · `TestGetAllExperimentConditions` |
| `POST /mark` | ✅ `markDecisionPoint`, `Assignment.markDecisionPoint` · `#markDecisionPoint` | ✅ `markDecisionPoint` (overloads), `Assignment.markDecisionPoint` · `markSendsCachedExperimentAndConditionIds`, `assignmentMarkSendsItsExperimentAndConditionIds` | ✅ `mark_decision_point`, `Assignment.mark_decision_point` · `TestMarkDecisionPoint` |
| `POST /log` | ✅ `log` · `#log` | ✅ `log` · `logPostsValueWithMetricsAndGroupedMetrics` | ✅ `log` · `TestLog` |
| `POST /featureflag` | ✅ `getAllFeatureFlags`, `hasFeatureFlag` · `#getAllFeatureFlags` | ✅ `getAllFeatureFlags`, `hasFeatureFlag` · `featureFlagRequestOmitsSessionGroupsByDefault` | ✅ `get_all_feature_flags`, `has_feature_flag` · `TestGetAllFeatureFlags` |
| `POST /featureflag` session groups | ✅ `featureFlagUserGroupsForSession` option, `setFeatureFlagUserGroupsForSession` · `UpgradeClient.cache.spec.ts` | ✅ `setFeatureFlagUserGroupsForSession` / `clearFeatureFlagUserGroupsForSession` (setter only) · `sessionGroupsAreSentAndInvalidateTheFlagCache` | ✅ `feature_flag_user_groups_for_session` kwarg, `set_feature_flag_user_groups_for_session` · `TestFeatureFlagUserGroupsForSession` (`test_client.py`) |
| `POST /reward` | ✅ `sendReward` · `#sendReward` | ✅ `sendRewardForExperiment`, `sendRewardForDecisionPoint` · `sendRewardFor…` tests | ✅ `send_reward` · `TestSendReward` |
| `POST /reward?awaitResult` | ✅ `sendReward({ awaitResult })` · `#sendReward` | ✅ `awaitResult` overloads · `sendRewardForDecisionPointPostsExplicitContextAndAwaitResult` | ✅ `send_reward(await_result=)` · `TestSendReward` |
| `DELETE /clearDB` | ➖ demo-mode admin route, not a client concern | ➖ same | ➖ same |
| Headers | ✅ checked in each `ApiService.spec.ts` block's expected options | ✅ `requestsCarryStandardClientHeaders`, `authToken…` tests | ✅ `assert_common_headers` |

## Extra fields sent (stripped by the server, not contract changes)

- **Java `/groupmembership` and `/workinggroup`** send `null` `createdAt`, `updatedAt`, `versionNumber`,
  `requestedUserId` (and the other group field) from the shared `ExperimentUser` bean.
- **Java `/init`** sends `group` and `workingGroup` as `null` when not given. That's allowed, since `/init` only
  rejects unknown field *names*.
- **JS `/mark`** spreads the cached condition into `assignedCondition`, so it also sends `payload`.
- **Python `/mark`** also sends `experimentType` and `assignedFactor`.
- **Python** also sends `userId` in the body of `/assign`, `/featureflag`, `/log` and `/useraliases`. The server
  uses the `User-Id` header.
