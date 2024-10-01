package org.upgradeplatform.client;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

import org.eclipse.jdt.annotation.NonNull;
import org.upgradeplatform.interfaces.ResponseCallback;
import org.upgradeplatform.requestbeans.ExperimentUser;
import org.upgradeplatform.requestbeans.MarkExperimentRequestData;
import org.upgradeplatform.responsebeans.Assignment;
import org.upgradeplatform.responsebeans.Condition;
import org.upgradeplatform.responsebeans.ErrorResponse;
import org.upgradeplatform.responsebeans.ExperimentUserResponse;
import org.upgradeplatform.responsebeans.InitializeUserResponse;
import org.upgradeplatform.responsebeans.MarkDecisionPoint;
import org.upgradeplatform.responsebeans.UserAliasResponse;
import org.upgradeplatform.utils.Utils;
import org.upgradeplatform.utils.Utils.MarkedDecisionPointStatus;

public class Main {
    public static void main(String[] args) throws InterruptedException, ExecutionException {
        final String baseUrl = "http://localhost:3030";
        final String userId = "barkely";
        final String site = "SelectSection";

        String target = args.length > 0 ? args[0] : "absolute_value_plot_equality";

        try (ExperimentClient experimentClient = new ExperimentClient(userId, "BearerToken", baseUrl,
                Collections.emptyMap())) {
            CompletableFuture<String> result = new CompletableFuture<>();

            System.out.println(prefix() + "initiating requests");
            experimentClient.init(new ResponseCallback<InitializeUserResponse>() {
                @Override
                public void onSuccess(@NonNull InitializeUserResponse t) {

                    List<String> schools = new ArrayList<>();
                    schools.add("school1");
                    Map<String, List<String>> group = new HashMap<>();
                    group.put("schoolid", schools);

                    System.out.println(prefix() + "setting group membership");
                    experimentClient.setGroupMembership(group, new ResponseCallback<ExperimentUserResponse>() {
                        @Override
                        public void onSuccess(@NonNull ExperimentUserResponse expResult) {
                            System.out.println(prefix() + "success updating groups; setting working group");

                            Map<String, String> workingGroup = new HashMap<>();
                            workingGroup.put("schoolId", "school1");
                            experimentClient.setWorkingGroup(workingGroup,
                                    new ResponseCallback<ExperimentUserResponse>() {
                                        @Override
                                        public void onSuccess(@NonNull ExperimentUserResponse expResult) {
                                            System.out.println(
                                                    prefix() + "success updating working groups; setting user aliases");

                                            List<String> altIds = new ArrayList<>();
                                            altIds.add(UUID.randomUUID().toString());
                                            experimentClient.setAltUserIds(altIds,
                                                    new ResponseCallback<UserAliasResponse>() {
                                                        @Override
                                                        public void onSuccess(@NonNull UserAliasResponse uar) {
                                                            System.out.println(
                                                                    prefix() + "success updating user aliases; getting conditions");

                                                            experimentClient.getExperimentCondition("assign-prog", site,
                                                                    target,
                                                                    new ResponseCallback<Assignment>() {
                                                                        @Override
                                                                        public void onSuccess(
                                                                                @NonNull Assignment expResult) {
                                                                            System.out.println(
                                                                                    prefix() + "success getting condition; marking");

                                                                            Condition condition = expResult
                                                                                    .getAssignedCondition();
                                                                            String code = condition == null ? null
                                                                                    : condition.getConditionCode();
                                                                            Utils.ExperimentType experimentType = expResult
                                                                                    .getExperimentType();
                                                                            System.out.println("experimentType");
                                                                            System.out.println(experimentType);

                                                                            System.out.println("condition");
                                                                            System.out.println(condition);

                                                                            System.out.println("code");
                                                                            System.out.println(code);
                                                                            MarkExperimentRequestData data = new MarkExperimentRequestData(
                                                                                    site, target, null);
                                                                            System.out.println(
                                                                                    data.getAssignedCondition());

                                                                            experimentClient.markDecisionPoint(
                                                                                    MarkedDecisionPointStatus.CONDITION_APPLIED,
                                                                                    data,
                                                                                    new ResponseCallback<MarkDecisionPoint>() {
                                                                                        @Override
                                                                                        public void onSuccess(
                                                                                                @NonNull MarkDecisionPoint markResult) {
                                                                                            result.complete("marked "
                                                                                                    + code + ": "
                                                                                                    + markResult
                                                                                                            .toString());
                                                                                        }

                                                                                        @Override
                                                                                        public void onError(
                                                                                                @NonNull ErrorResponse error) {
                                                                                            result.complete(
                                                                                                    "error marking "
                                                                                                            + code
                                                                                                            + ": "
                                                                                                            + error.toString());
                                                                                        }
                                                                                    });
                                                                        }

                                                                        @Override
                                                                        public void onError(
                                                                                @NonNull ErrorResponse error) {
                                                                            result.complete(error.toString());
                                                                        }

                                                                    });
                                                        }

                                                        @Override
                                                        public void onError(@NonNull ErrorResponse error) {
                                                            result.complete(error.toString());
                                                        }

                                                    });
                                        }

                                        @Override
                                        public void onError(@NonNull ErrorResponse error) {
                                            result.complete(error.toString());
                                        }
                                    });
                        }

                        @Override
                        public void onError(@NonNull ErrorResponse error) {
                            result.complete(error.toString());
                        }
                    });

                    System.out.println(prefix() + "getting feature flags");
                    experimentClient.getAllFeatureFlags("assign-prog-test", new ResponseCallback<List<String>>() {
                        @Override
                        public void onSuccess(@NonNull List<String> featureFlags) {
                            System.out.println(prefix() + "featureFlags = " + featureFlags);
                            experimentClient.hasFeatureFlag("assign-prog-test", "main-java".toUpperCase(),
                                    new ResponseCallback<Boolean>() {
                                        @Override
                                        public void onSuccess(@NonNull Boolean found) {
                                            System.out.println(prefix() + "featureFlag (MAIN-JAVA) found = " + found);
                                        }

                                        @Override
                                        public void onError(@NonNull ErrorResponse error) {
                                            result.complete(error.toString());
                                        }
                                    });
                        }

                        @Override
                        public void onError(@NonNull ErrorResponse error) {
                            result.complete(error.toString());
                        }
                    });
                }

                @Override
                public void onError(@NonNull ErrorResponse error) {
                    result.complete("error initializing: " + error.toString());
                }
            });

            System.out.println(prefix() + result.getNow("not complete yet"));
            String rs = result.get();
            System.out.println(prefix() + rs);
        }
    }

    private static final String prefix() {
        return "on thread " + Thread.currentThread().getName() + " at " + System.currentTimeMillis() + ": ";
    }
}