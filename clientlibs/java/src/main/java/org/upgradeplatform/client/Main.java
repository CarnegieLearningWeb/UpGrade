package org.upgradeplatform.client;

import java.util.Collections;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

import org.eclipse.jdt.annotation.NonNull;
import org.upgradeplatform.interfaces.ResponseCallback;
import org.upgradeplatform.responsebeans.AssignedCondition;
import org.upgradeplatform.responsebeans.ErrorResponse;
import org.upgradeplatform.responsebeans.ExperimentsResponse;
import org.upgradeplatform.responsebeans.InitializeUser;
import org.upgradeplatform.responsebeans.MarkExperimentPoint;
import org.upgradeplatform.utils.Utils.MarkedDecisionPointStatus;

public class Main {
	public static void main(String[] args) throws InterruptedException, ExecutionException
	{
		final String baseUrl = "http://localhost:3030";
		final String userId = UUID.randomUUID().toString();
		final String decisionSite = "add-point1";

		String target = args.length > 0 ? args[0] : "add-id1";

		try(ExperimentClient experimentClient = new ExperimentClient(userId, "BearerToken", baseUrl, Collections.emptyMap())){
		    CompletableFuture<String> result = new CompletableFuture<>();

            System.out.println(prefix() + "initiating requests");
            experimentClient.init(new ResponseCallback<InitializeUser>() {
                @Override
                public void onSuccess(InitializeUser t){
                    experimentClient.getExperimentCondition("add", decisionSite, target, new ResponseCallback<ExperimentsResponse>(){
                        @Override
                        public void onSuccess(ExperimentsResponse expResult){
                            AssignedCondition condition = expResult.getAssignedCondition();
                            String code = condition == null ? null : condition.getConditionCode();
                            System.out.println(expResult);
                            experimentClient.markExperimentPoint(decisionSite, target, code, MarkedDecisionPointStatus.NO_CONDITION_ASSIGNED, new ResponseCallback<MarkExperimentPoint>(){
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
