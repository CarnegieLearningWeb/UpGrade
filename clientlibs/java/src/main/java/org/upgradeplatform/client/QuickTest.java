package org.upgradeplatform.client;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

import org.eclipse.jdt.annotation.NonNull;
import org.upgradeplatform.interfaces.ResponseCallback;
import org.upgradeplatform.responsebeans.*;
import org.upgradeplatform.utils.Utils.BinaryRewardValue;
import org.upgradeplatform.utils.Utils.ExperimentType;
import org.upgradeplatform.utils.Utils.MarkedDecisionPointStatus;
import org.upgradeplatform.utils.Utils.PayloadType;
import org.upgradeplatform.requestbeans.LogGroupMetrics;
import org.upgradeplatform.requestbeans.LogInput;
import org.upgradeplatform.requestbeans.LogMetrics;

/**
 * Manual end-to-end smoke test: one user runs init, group and working-group membership, aliases, assign,
 * decision-point assignment, feature flags (with stored groups, then with each session-group mode), mark, reward
 * (by experiment id and by decision point, each queued and awaited) and log, in order, against a running server.
 *
 * <pre>
 * mvn exec:java -Dexec.mainClass="org.upgradeplatform.client.QuickTest"
 * mvn exec:java -Dexec.mainClass="org.upgradeplatform.client.QuickTest" -Dexec.args="local:3031"
 * mvn exec:java -Dexec.mainClass="org.upgradeplatform.client.QuickTest" -Dexec.args="qa"
 * mvn exec:java -Dexec.mainClass="org.upgradeplatform.client.QuickTest" -Dexec.args="staging"
 * mvn exec:java -Dexec.mainClass="org.upgradeplatform.client.QuickTest" -Dexec.args="https://some-host.example.com"
 * </pre>
 *
 * The optional argument is local (default, http://localhost:3030), local:&lt;port&gt; for localhost on another port,
 * qa, staging, or a base URL starting with http:// or https://.
 * <p>
 * <b>qa and staging are not built in.</b> Their URLs come from environment variables you set on your own machine,
 * which you need to add to your shell profile (e.g. {@code ~/.zshrc}) once:
 *
 * <pre>
 * export UPGRADE_QA_URL=https://&lt;qa backend host&gt;
 * export UPGRADE_STAGING_URL=https://&lt;staging backend host&gt;
 * </pre>
 *
 * See QuickTestHosts for details. Passing a base URL directly needs no variables.
 */
public class QuickTest {
    private static final String userId = "quicktest_user_" + System.currentTimeMillis();
    private static final String sessionId = "quicktest_session_" + System.currentTimeMillis();
    private static final String group = "test_class_group";
    private static final String alias = "alias" + userId;
    private static final String context = "upgrade-internal";
    private static final String site = "SelectSection";
    private static final String target = "my_fave_workspac";
    private static final String condition = "control";
    private static final MarkedDecisionPointStatus status = MarkedDecisionPointStatus.CONDITION_APPLIED;
    private static final String featureFlagKey = "TEST_FEATURE_FLAG";
    // session-scoped groups for the feature-flag modes; the modes only return different flags if some flag's
    // segment includes this group
    private static final Map<String, List<String>> groupsForSession = Collections.singletonMap("classId",
            Collections.singletonList("EPHEMERAL_USER_GROUP"));
    private static final BinaryRewardValue rewardValue = BinaryRewardValue.SUCCESS;

    private static final List<LogInput> logRequest = new ArrayList<>();

    static {
        HashMap<String, Object> attributes = new HashMap<String, Object>();
        attributes.put("totalTimeSeconds", 41834);
        attributes.put("totalMasteryWorkspacesCompleted", 15);
        attributes.put("totalConceptBuildersCompleted", 17);
        attributes.put("totalMasteryWorkspacesGraduated", 15);
        attributes.put("totalSessions", 50);
        attributes.put("totalProblemsCompleted", 249);

        List<LogGroupMetrics> groupedMetric = new ArrayList<LogGroupMetrics>();

        LogInput logEntry = new LogInput("2022-03-03T19:49:00.496", new LogMetrics(attributes, groupedMetric));
        logRequest.add(logEntry);
    }

    /**
     * Optional first argument: local (default), local:&lt;port&gt;, qa, staging, or a base URL; see QuickTestHosts for
     * the env vars qa/staging need.
     */
    public static void main(String[] args) throws InterruptedException, ExecutionException {
        String host = args.length > 0 ? args[0] : "local";
        String hostUrl = host.startsWith("http://") || host.startsWith("https://") ? host : QuickTestHosts.forEnv(host);
        System.out.println("host: " + hostUrl);
        System.out.println("client_session_id: " + sessionId);
        ExperimentClient client = new ExperimentClient(userId, context, "BearerToken", sessionId, hostUrl,
                Collections.emptyMap());
        CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
            try {
                doInit(client)
                        .thenCompose(v -> doGroupMembership(client))
                        .thenCompose(v -> doWorkingGroupMembership(client))
                        .thenCompose(v -> doAliases(client))
                        .thenCompose(v -> doAssign(client))
                        .thenCompose(v -> doAssignIgnoreCache(client))
                        .thenCompose(v -> doGetDecisionPointAssignment(client))
                        .thenCompose(v -> doFeatureFlags(client))
                        .thenCompose(v -> doFeatureFlagsIgnoreCache(client))
                        .thenCompose(v -> doHasFeatureFlag(client))
                        .thenCompose(v -> doFeatureFlagsWithSessionGroups(client, true))
                        .thenCompose(v -> doFeatureFlagsWithSessionGroups(client, false))
                        .thenCompose(v -> doFeatureFlagsWithSessionGroupsCleared(client))
                        .thenCompose(v -> doMark(client))
                        .thenCompose(v -> doSendRewardForExperiment(client, false))
                        .thenCompose(v -> doSendRewardForExperiment(client, true))
                        .thenCompose(v -> doSendRewardForDecisionPoint(client, false))
                        .thenCompose(v -> doSendRewardForDecisionPoint(client, true))
                        .thenCompose(v -> doLog(client))
                        .exceptionally(e -> {
                            e.printStackTrace();
                            return null;
                        }).get();
            } catch (Exception e) {
                e.printStackTrace();
            }
        });

        future.get();
    }

    private static CompletableFuture<Void> doInit(ExperimentClient client) {
        CompletableFuture<Void> future = new CompletableFuture<>();
        client.init(new ResponseCallback<InitializeUserResponse>() {
            @Override
            public void onSuccess(@NonNull InitializeUserResponse response) {
                System.out.println("\n[Init response]:" + response);
                future.complete(null);
            }

            @Override
            public void onError(@NonNull ErrorResponse error) {
                System.err.println("\n[Init error]:" + error);
                future.completeExceptionally(new RuntimeException(error.toString()));
            }
        });
        return future;
    }

    private static CompletableFuture<Void> doGroupMembership(ExperimentClient client) {
        CompletableFuture<Void> future = new CompletableFuture<>();
        Map<String, List<String>> groupRequest = new HashMap<>();
        groupRequest.put("schoolId", Collections.singletonList(group));

        client.setGroupMembership(groupRequest, new ResponseCallback<ExperimentUserResponse>() {
            @Override
            public void onSuccess(@NonNull ExperimentUserResponse response) {
                System.out.println("\n[Group response]:" + response);
                future.complete(null);
            }

            @Override
            public void onError(@NonNull ErrorResponse error) {
                System.err.println("\n[Group error]:" + error);
                future.completeExceptionally(new RuntimeException(error.toString()));
            }
        });
        return future;
    }

    private static CompletableFuture<Void> doWorkingGroupMembership(ExperimentClient client) {
        CompletableFuture<Void> future = new CompletableFuture<>();
        Map<String, String> workingGroupRequest = new HashMap<>();
        workingGroupRequest.put("workingGroup", group);

        client.setWorkingGroup(workingGroupRequest, new ResponseCallback<ExperimentUserResponse>() {
            @Override
            public void onSuccess(@NonNull ExperimentUserResponse response) {
                System.out.println("\n[Working Group response]:" + response);
                future.complete(null);
            }

            @Override
            public void onError(@NonNull ErrorResponse error) {
                System.err.println("\n[Working Group error]:" + error);
                future.completeExceptionally(new RuntimeException(error.toString()));
            }
        });
        return future;
    }

    private static CompletableFuture<Void> doAliases(ExperimentClient client) {
        CompletableFuture<Void> future = new CompletableFuture<>();
        List<String> aliasRequest = Collections.singletonList(alias);

        client.setAltUserIds(aliasRequest, new ResponseCallback<UserAliasResponse>() {
            @Override
            public void onSuccess(@NonNull UserAliasResponse response) {
                System.out.println("\n[Aliases response]:" + response);
                future.complete(null);
            }

            @Override
            public void onError(@NonNull ErrorResponse error) {
                System.err.println("\n[Aliases error]:" + error);
                future.completeExceptionally(new RuntimeException(error.toString()));
            }
        });
        return future;
    }

    private static CompletableFuture<Void> doAssign(ExperimentClient client) {
        CompletableFuture<Void> future = new CompletableFuture<>();
        client.getAllExperimentConditions(new ResponseCallback<List<ExperimentsResponse>>() {
            @Override
            public void onSuccess(@NonNull List<ExperimentsResponse> response) {
                System.out.println("\n[Assign response]:" + response);
                future.complete(null);
            }

            @Override
            public void onError(@NonNull ErrorResponse error) {
                System.err.println("\n[Assign error]:" + error);
                future.completeExceptionally(new RuntimeException(error.toString()));
            }
        });
        return future;
    }

    private static CompletableFuture<Void> doAssignIgnoreCache(ExperimentClient client) {
        CompletableFuture<Void> future = new CompletableFuture<>();
        client.getAllExperimentConditions(true, new ResponseCallback<List<ExperimentsResponse>>() {
            @Override
            public void onSuccess(@NonNull List<ExperimentsResponse> response) {
                System.out.println("\n[Assign response]:" + response);
                future.complete(null);
            }

            @Override
            public void onError(@NonNull ErrorResponse error) {
                System.err.println("\n[Assign error]:" + error);
                future.completeExceptionally(new RuntimeException(error.toString()));
            }
        });
        return future;
    }

    private static CompletableFuture<Void> doGetDecisionPointAssignment(ExperimentClient client) {
        CompletableFuture<Void> future = new CompletableFuture<>();
        client.getExperimentCondition(site, target, new ResponseCallback<Assignment>() {
            @Override
            public void onSuccess(@NonNull Assignment response) {
                System.out.println("\n[Decision Point Assignment response]:" + response);

                Condition condition = response.getAssignedCondition();
                ExperimentType experimentType = response.getExperimentType();

                if (condition == null) {
                    System.out.println("\n[Decision Point Assignment response] condition: null");
                    future.complete(null);
                    return;
                }

                String code = condition.getConditionCode();
                Payload payload = condition.getPayload();

                if (payload == null) {
                    System.out.println("\n[Decision Point Assignment response] payload: null");
                    future.complete(null);
                    return;
                }

                System.out.println("\n[Decision Point Assignment response] code: " + code);
                System.out.println("\n[Decision Point Assignment response] experimentType: " + experimentType);

                PayloadType payloadType = payload.getType();
                String payloadValue = payload.getValue();
                System.out.println("\n[Decision Point Assignment response] payloadType: " + payloadType);
                System.out.println("\n[Decision Point Assignment response] payloadValue: " + payloadValue);

                future.complete(null);
            }

            @Override
            public void onError(@NonNull ErrorResponse error) {
                System.err.println("\n[Decision Point Assignment error]:" + error);
                future.completeExceptionally(new RuntimeException(error.toString()));
            }
        });
        return future;
    }

    private static CompletableFuture<Void> doFeatureFlags(ExperimentClient client) {
        CompletableFuture<Void> future = new CompletableFuture<>();
        client.getAllFeatureFlags(new ResponseCallback<List<String>>() {
            @Override
            public void onSuccess(@NonNull List<String> response) {
                System.out.println("\n[Feature Flag response]:" + response);
                future.complete(null);
            }

            @Override
            public void onError(@NonNull ErrorResponse error) {
                System.err.println("\n[Feature Flag error]:" + error);
                future.completeExceptionally(new RuntimeException(error.toString()));
            }
        });
        return future;
    }

    private static CompletableFuture<Void> doFeatureFlagsIgnoreCache(ExperimentClient client) {
        CompletableFuture<Void> future = new CompletableFuture<>();
        client.getAllFeatureFlags(true, new ResponseCallback<List<String>>() {
            @Override
            public void onSuccess(@NonNull List<String> response) {
                System.out.println("\n[Feature Flag response]:" + response);
                future.complete(null);
            }

            @Override
            public void onError(@NonNull ErrorResponse error) {
                System.err.println("\n[Feature Flag error]:" + error);
                future.completeExceptionally(new RuntimeException(error.toString()));
            }
        });
        return future;
    }

    private static CompletableFuture<Void> doHasFeatureFlag(ExperimentClient client) {
        CompletableFuture<Void> future = new CompletableFuture<>();
        client.hasFeatureFlag(featureFlagKey, new ResponseCallback<Boolean>() {
            @Override
            public void onSuccess(@NonNull Boolean response) {
                System.out.println("\n[Has Feature Flag response]:" + response);
                future.complete(null);
            }

            @Override
            public void onError(@NonNull ErrorResponse error) {
                System.err.println("\n[Has Feature Flag error]:" + error);
                future.completeExceptionally(new RuntimeException(error.toString()));
            }
        });
        return future;
    }

    /**
     * Evaluate the flags with session groups: merged with the user's stored groups when
     * {@code includeStoredUserGroups} is true, or in place of them when false.
     */
    private static CompletableFuture<Void> doFeatureFlagsWithSessionGroups(ExperimentClient client,
            boolean includeStoredUserGroups) {
        // clears the cached flags, so the fetch goes to the server with the session groups
        client.setFeatureFlagUserGroupsForSession(groupsForSession, includeStoredUserGroups);
        return fetchFeatureFlags(client, includeStoredUserGroups ? "session + stored groups" : "session groups only");
    }

    /** Back to the user's stored groups alone, after the session-group modes above. */
    private static CompletableFuture<Void> doFeatureFlagsWithSessionGroupsCleared(ExperimentClient client) {
        client.clearFeatureFlagUserGroupsForSession();
        return fetchFeatureFlags(client, "session groups cleared");
    }

    private static CompletableFuture<Void> fetchFeatureFlags(ExperimentClient client, String mode) {
        CompletableFuture<Void> future = new CompletableFuture<>();
        client.getAllFeatureFlags(new ResponseCallback<List<String>>() {
            @Override
            public void onSuccess(@NonNull List<String> response) {
                System.out.println("\n[Feature Flag (" + mode + ") response]:" + response);
                System.out.println("\n[Feature Flag (" + mode + ") response] has " + featureFlagKey + ": "
                        + response.contains(featureFlagKey));
                future.complete(null);
            }

            @Override
            public void onError(@NonNull ErrorResponse error) {
                System.err.println("\n[Feature Flag (" + mode + ") error]:" + error);
                future.completeExceptionally(new RuntimeException(error.toString()));
            }
        });
        return future;
    }

    private static CompletableFuture<Void> doMark(ExperimentClient client) {
        CompletableFuture<Void> future = new CompletableFuture<>();
        client.markDecisionPoint(site, target, condition, status, new ResponseCallback<MarkDecisionPoint>() {
            @Override
            public void onSuccess(@NonNull MarkDecisionPoint response) {
                System.out.println("\n[Mark response]:" + response);
                future.complete(null);
            }

            @Override
            public void onError(@NonNull ErrorResponse error) {
                System.err.println("\n[Mark error]:" + error);
                future.completeExceptionally(new RuntimeException(error.toString()));
            }
        });
        return future;
    }

    /**
     * Reward the experiment assigned at the decision point, by its id. Without {@code awaitResult} the server
     * queues the reward (mode "accepted"); with it, the server records the reward before responding (mode
     * "processed") and answers one it can't record with a 409. The server doesn't deduplicate rewards, so the four
     * reward paths add four observations for this user to a Thompson Sampling experiment.
     */
    private static CompletableFuture<Void> doSendRewardForExperiment(ExperimentClient client, boolean awaitResult) {
        CompletableFuture<Void> future = new CompletableFuture<>();
        String label = "Send Reward (by experiment id, awaitResult=" + awaitResult + ")";
        client.getExperimentCondition(site, target, new ResponseCallback<Assignment>() {
            @Override
            public void onSuccess(@NonNull Assignment response) {
                Condition assignedCondition = response.getAssignedCondition();
                if (assignedCondition == null || assignedCondition.getExperimentId() == null) {
                    System.out.println("\n[" + label + "] skipped: no experiment assigned at " + site + "/" + target);
                    future.complete(null);
                    return;
                }
                client.sendRewardForExperiment(rewardValue, assignedCondition.getExperimentId(), awaitResult,
                        rewardCallback(label, future));
            }

            @Override
            public void onError(@NonNull ErrorResponse error) {
                System.err.println("\n[" + label + " error]:" + error);
                future.complete(null);
            }
        });
        return future;
    }

    /** Reward the experiment at the decision point, by context, site and target; see doSendRewardForExperiment. */
    private static CompletableFuture<Void> doSendRewardForDecisionPoint(ExperimentClient client, boolean awaitResult) {
        CompletableFuture<Void> future = new CompletableFuture<>();
        client.sendRewardForDecisionPoint(rewardValue, context, site, target, awaitResult,
                rewardCallback("Send Reward (by decision point, awaitResult=" + awaitResult + ")", future));
        return future;
    }

    // A failed reward is printed but doesn't stop the run: the decision point needn't be a Thompson Sampling
    // experiment, and with awaitResult the server answers a reward for any other experiment with a 409.
    private static ResponseCallback<SendRewardResponse> rewardCallback(String label, CompletableFuture<Void> future) {
        return new ResponseCallback<SendRewardResponse>() {
            @Override
            public void onSuccess(@NonNull SendRewardResponse response) {
                System.out.println("\n[" + label + " response]:" + response);
                future.complete(null);
            }

            @Override
            public void onError(@NonNull ErrorResponse error) {
                System.err.println("\n[" + label + " error]:" + error);
                future.complete(null);
            }
        };
    }

    private static CompletableFuture<Void> doLog(ExperimentClient client) {
        CompletableFuture<Void> future = new CompletableFuture<>();
        client.log(logRequest, new ResponseCallback<List<LogEventResponse>>() {
            @Override
            public void onSuccess(@NonNull List<LogEventResponse> response) {
                System.out.println("\n[Log response]:" + response);
                future.complete(null);
            }

            @Override
            public void onError(@NonNull ErrorResponse error) {
                System.err.println("\n[Log error]:" + error);
                future.completeExceptionally(new RuntimeException(error.toString()));
            }
        });
        return future;
    }
}