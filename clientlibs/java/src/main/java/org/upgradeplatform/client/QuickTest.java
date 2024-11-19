package org.upgradeplatform.client;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

import org.eclipse.jdt.annotation.NonNull;
import org.upgradeplatform.interfaces.ResponseCallback;
import org.upgradeplatform.requestbeans.MarkExperimentRequestData;
import org.upgradeplatform.responsebeans.*;
import org.upgradeplatform.utils.Utils;
import org.upgradeplatform.utils.Utils.ExperimentType;
import org.upgradeplatform.utils.Utils.MarkedDecisionPointStatus;
import org.upgradeplatform.utils.Utils.PayloadType;
import org.upgradeplatform.requestbeans.LogGroupMetrics;
import org.upgradeplatform.requestbeans.LogInput;
import org.upgradeplatform.requestbeans.LogMetrics;

public class QuickTest {
    private static final String LOCAL_URL = "http://localhost:3030";
    private static final String BEANSTALK_QA_URL = "https://upgradeapi.qa-cli.net";
    private static final String BEANSTALK_STAGING_URL = "https://upgradeapi.qa-cli.com";
    private static final String ECS_QA_URL = "https://apps.qa-cli.net/upgrade-service";
    private static final String ECS_STAGING_URL = "https://apps.qa-cli.com/upgrade-service";

    private static final String userId = "quicktest_user_" + System.currentTimeMillis();
    private static final String group = "test_class_group";
    private static final String alias = "alias" + userId;
    private static final String hostUrl = LOCAL_URL;
    private static final String context = "assign-prog";
    private static final String site = "SelectSection";
    private static final String target = "absolute_value_plot_equality";
    private static final String condition = "control";
    private static final MarkedDecisionPointStatus status = MarkedDecisionPointStatus.CONDITION_APPLIED;
    private static final String featureFlagKey = "TEST_FEATURE_FLAG";

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

    public static void main(String[] args) throws InterruptedException, ExecutionException {
        ExperimentClient client = new ExperimentClient(userId, "BearerToken", hostUrl, Collections.emptyMap());
        CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
            try {
                doInit(client)
                        .thenCompose(v -> doGroupMembership(client))
                        .thenCompose(v -> doWorkingGroupMembership(client))
                        .thenCompose(v -> doAliases(client))
                        .thenCompose(v -> doAssign(client))
                        .thenCompose(v -> doGetDecisionPointAssignment(client))
                        .thenCompose(v -> doFeatureFlags(client))
                        .thenCompose(v -> doHasFeatureFlag(client))
                        .thenCompose(v -> doMark(client))
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
        client.getAllExperimentConditions(context, new ResponseCallback<List<ExperimentsResponse>>() {
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
        client.getExperimentCondition(context, site, target, new ResponseCallback<Assignment>() {
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
        client.getAllFeatureFlags(context, new ResponseCallback<List<String>>() {
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
        client.hasFeatureFlag(context, featureFlagKey, new ResponseCallback<Boolean>() {
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