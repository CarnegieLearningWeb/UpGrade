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
import org.upgradeplatform.responsebeans.Condition;
import org.upgradeplatform.responsebeans.ErrorResponse;
import org.upgradeplatform.responsebeans.ExperimentUser;
import org.upgradeplatform.responsebeans.ExperimentsResponse;
import org.upgradeplatform.responsebeans.InitializeUser;
import org.upgradeplatform.responsebeans.MarkExperimentPoint;
import org.upgradeplatform.responsebeans.UserAliasResponse;
import org.upgradeplatform.utils.Utils.MarkedDecisionPointStatus;

public class Main {
    public static void main(String[] args) throws InterruptedException, ExecutionException
    {
        final String baseUrl = "https://upgradeapi.qa-cli.com";
        final String userId = UUID.randomUUID().toString();
        final String site = "SelectSection";

        String target = args.length > 0 ? args[0] : "graph_setup_linear_equation-1";

        try(ExperimentClient experimentClient = new ExperimentClient(userId, "BearerToken", baseUrl, Collections.emptyMap())){
            CompletableFuture<String> result = new CompletableFuture<>();

            System.out.println(prefix() + "initiating requests");
            experimentClient.init(new ResponseCallback<InitializeUser>() {
                @Override
                public void onSuccess(@NonNull InitializeUser t){

                    List<String> schools = new ArrayList<>();
                    schools.add("school1");
                    Map<String, List<String>> group = new HashMap<>();
                    group.put("schoolid", schools);

                    System.out.println(prefix() + "setting group membership");
                    experimentClient.setGroupMembership(group, new ResponseCallback<ExperimentUser>(){
                        @Override
                        public void onSuccess(@NonNull ExperimentUser expResult){
                            System.out.println(prefix() + "success updating groups; setting working group");

                            Map<String, String> workingGroup = new HashMap<>();
                            workingGroup.put("schoolId", "school1");
                            experimentClient.setWorkingGroup(workingGroup, new ResponseCallback<ExperimentUser>(){
                                @Override
                                public void onSuccess(@NonNull ExperimentUser expResult){
                                    System.out.println(prefix() + "success updating working groups; setting user aliases");

                                    List<String> altIds = new ArrayList<>();
                                    altIds.add(UUID.randomUUID().toString());
                                    experimentClient.setAltUserIds(altIds, new ResponseCallback<UserAliasResponse>(){
                                        @Override
                                        public void onSuccess(@NonNull UserAliasResponse uar) {
                                            System.out.println(prefix() + "success updating user aliases; getting conditions");

                                            experimentClient.getExperimentCondition("assign-prog", site, target, new ResponseCallback<ExperimentsResponse>(){
                                                @Override
                                                public void onSuccess(@NonNull ExperimentsResponse expResult){
                                                    System.out.println(prefix() + "success getting condition; marking");

                                                    Condition condition = expResult.getAssignedCondition();
                                                    String code = condition == null ? null : condition.getCondition();
                                                    experimentClient.markExperimentPoint(site, target, code, MarkedDecisionPointStatus.CONDITION_APPLIED, new ResponseCallback<MarkExperimentPoint>(){
                                                        @Override
                                                        public void onSuccess(@NonNull MarkExperimentPoint markResult){
                                                            result.complete("marked " + code + ": " + markResult.toString());
                                                        }

                                                        @Override
                                                        public void onError(@NonNull ErrorResponse error){
                                                            result.complete("error marking " + code + ": " + error.toString());
                                                        }
                                                    });
                                                }

                                                @Override
                                                public void onError(@NonNull ErrorResponse error){
                                                    result.complete(error.toString());
                                                }

                                            });
                                        }
                                        @Override
                                        public void onError(@NonNull ErrorResponse error){
                                            result.complete(error.toString());
                                        }

                                    });
                                }
                                @Override
                                public void onError(@NonNull ErrorResponse error){
                                    result.complete(error.toString());
                                }
                            });
                        }
                        @Override
                        public void onError(@NonNull ErrorResponse error){
                            result.complete(error.toString());
                        }
                    });
                }

                @Override
                public void onError(@NonNull ErrorResponse error){
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