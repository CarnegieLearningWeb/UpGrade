package org.upgradeplatform.client;


import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

import org.eclipse.jdt.annotation.NonNull;
import org.upgradeplatform.interfaces.ResponseCallback;
import org.upgradeplatform.responsebeans.ErrorResponse;
import org.upgradeplatform.responsebeans.ExperimentsResponse;
import org.upgradeplatform.responsebeans.InitRequest;



public class Main {
	public static void main(String []args) throws InterruptedException, ExecutionException
	{
		String baseUrl = "http://development-upgrade-experiment-app.eba-gp6psjut.us-east-1.elasticbeanstalk.com";
		String userId = "user1";
	
		
		String[] classList = {"1","2","3","4","5"};
		String[] teacherList = {"1","2","7"};
		
		HashMap<String, List<String>> group = new HashMap<>();
		group.put("classes", Arrays.asList(classList));
		group.put("teachers", Arrays.asList(teacherList));

		try(ExperimentClient experimentClient = new ExperimentClient(userId, "BearerToken", baseUrl)){
		    CompletableFuture<String> result = new CompletableFuture<>();

            System.out.println(prefix() + "initiating requests");
		    experimentClient.setGroupMembership(group, new ResponseCallback<InitRequest>(){
		        @Override
		        public void onSuccess(InitRequest __){
		            experimentClient.getAllExperimentCondition("addition hard", new ResponseCallback<List<ExperimentsResponse>>() {

		                @Override
		                public void onSuccess(@NonNull List<ExperimentsResponse> ers) {
		                    experimentClient.getExperimentCondition("foo", new ResponseCallback<ExperimentsResponse>(){

                                @Override
                                public void onSuccess(@NonNull ExperimentsResponse er){
                                    result.complete(prefix() + "retrieved " + ers.size() + " experiment responses; foo response: " + er);
                                }

                                @Override
                                public void onError(@NonNull ErrorResponse error){
                                    result.completeExceptionally(new Exception(prefix() + error.toString()));
                                }
                            });
		                }

		                @Override
		                public void onError(@NonNull ErrorResponse error) {
                            result.completeExceptionally(new Exception(prefix() + error.toString()));
		                }
		            });
		        }

		        @Override
		        public void onError(@NonNull ErrorResponse error){
                    result.completeExceptionally(new Exception(prefix() + error.toString()));
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
