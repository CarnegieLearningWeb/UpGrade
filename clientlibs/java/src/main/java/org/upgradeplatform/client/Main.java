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
import org.upgradeplatform.responsebeans.UserAliasResponse;
import org.upgradeplatform.responsebeans.AssignedCondition;
import org.upgradeplatform.responsebeans.ErrorResponse;
import org.upgradeplatform.responsebeans.ExperimentUser;
import org.upgradeplatform.responsebeans.ExperimentsResponse;
import org.upgradeplatform.responsebeans.InitializeUser;
import org.upgradeplatform.responsebeans.MarkExperimentPoint;
import org.upgradeplatform.utils.Utils.MarkedDecisionPointStatus;

public class Main {
	public static void main(String[] args) throws InterruptedException, ExecutionException
	{
		final String baseUrl = "http://localhost:3030";
		final String userId = UUID.randomUUID().toString();
		final String experimentPoint = "SelectSection";

		String sectionId = args.length > 0 ? args[0] : "absolute_value_plot_equality";

		try(ExperimentClient experimentClient = new ExperimentClient(userId, "BearerToken", baseUrl, Collections.emptyMap())){
		    CompletableFuture<String> result = new CompletableFuture<>();

            System.out.println(prefix() + "initiating requests");
            experimentClient.init(new ResponseCallback<InitializeUser>() {
                @Override
                public void onSuccess(@NonNull InitializeUser t){

                    List<String> schools = new ArrayList<String>();
                    schools.add("school1");
                    Map<String, List<String>> group = new HashMap<String, List<String>>();
                    group.put("schoolid", schools);

                    System.out.println(prefix() + "setting group membership");
                    experimentClient.setGroupMembership(group, new ResponseCallback<ExperimentUser>(){
                        @Override
                        public void onSuccess(@NonNull ExperimentUser expResult){
                            System.out.println("success updating groups");
                        }
                        @Override
                        public void onError(@NonNull ErrorResponse error){
                            System.out.println("error updating groups " + error);
                        }
                    });


                    System.out.println(prefix() + "setting working group");
                    Map<String, String> workingGroup = new HashMap<String, String>();
                    workingGroup.put("schoolId", "school1");
                    experimentClient.setWorkingGroup(workingGroup, new ResponseCallback<ExperimentUser>(){
                        @Override
                        public void onSuccess(@NonNull ExperimentUser expResult){
                            System.out.println("success updating working groups");
                        }
                        @Override
                        public void onError(@NonNull ErrorResponse error){
                            System.out.println("error updating working groups " + error);
                        }
                    });


                    System.out.println(prefix() + "setting user aliases");
                    List<String> altIds = new ArrayList<String>();
                    altIds.add(UUID.randomUUID().toString());
                    experimentClient.setAltUserIds(altIds, new ResponseCallback<UserAliasResponse>(){
                        @Override
                        public void onSuccess(@NonNull UserAliasResponse t) {
                            System.out.println("success updating user aliases");
                        }
                        @Override
                        public void onError(@NonNull ErrorResponse error){
                            System.out.println("error updating user aliases " + error);
                        }

                    });

                    System.out.println(prefix() + "getting conditions");
                    experimentClient.getExperimentCondition("assign-prog", experimentPoint, sectionId, new ResponseCallback<ExperimentsResponse>(){
                        @Override
                        public void onSuccess(@NonNull ExperimentsResponse expResult){
                            AssignedCondition condition = expResult.getAssignedCondition();
                            String code = condition == null ? null : condition.getConditionCode();
                            experimentClient.markExperimentPoint(experimentPoint, sectionId, code, MarkedDecisionPointStatus.CONDITION_APPLIED, new ResponseCallback<MarkExperimentPoint>(){
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