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

public class Main {
	public static void main(String[] args) throws InterruptedException, ExecutionException
	{
		final String baseUrl = "http://upgradeapi.qa-cli.com";
		final String userId = UUID.randomUUID().toString();
		final String experimentPoint = "SelectSection";

		String sectionId = args.length > 0 ? args[0] : "test_dummy_variants_nonmastery";

		try(ExperimentClient experimentClient = new ExperimentClient(userId, "BearerToken", baseUrl, Collections.emptyMap())){
		    CompletableFuture<String> result = new CompletableFuture<>();

            System.out.println(prefix() + "initiating requests");
            experimentClient.init(new ResponseCallback<InitializeUser>() {
                @Override
                public void onSuccess(InitializeUser t){
                    experimentClient.getExperimentCondition("assign-prog", experimentPoint, sectionId, new ResponseCallback<ExperimentsResponse>(){
                        @Override
                        public void onSuccess(ExperimentsResponse expResult){
                            AssignedCondition condition = expResult.getAssignedCondition();
                            String code = condition == null ? null : condition.getConditionCode();
                            experimentClient.markExperimentPoint(experimentPoint, sectionId, code, new ResponseCallback<MarkExperimentPoint>(){
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
