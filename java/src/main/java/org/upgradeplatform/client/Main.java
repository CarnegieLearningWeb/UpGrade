package org.upgradeplatform.client;


import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

import org.eclipse.jdt.annotation.NonNull;
import org.upgradeplatform.interfaces.ResponseCallback;
import org.upgradeplatform.responsebeans.ErrorResponse;
import org.upgradeplatform.responsebeans.InitRequest;
import org.upgradeplatform.responsebeans.LogEventResponse;
import org.upgradeplatform.responsebeans.Value;

import com.fasterxml.jackson.databind.ObjectMapper;

import io.vavr.control.Either;



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
		        @SuppressWarnings("rawtypes")
				@Override
		        public void onSuccess(InitRequest i){
		        	
		        	
		        	String key = "key";
		        	
		        	// The value variable in Log method can be of type Integer, String or JSON
		        	
		        	Either<Integer, Either<String, Value>> value;
		        	// value = Either.left(10); 								// (Integer example)
		        	// value = Either.right(Either.left("String")); 			// (String example)
		        	value = Either.right(Either.right(new Value(25,"5",6))); 	// (Custom JSON example using POJO)
		    		
		        	
		    		
		            experimentClient.log(key, value, new ResponseCallback<LogEventResponse>() {

						@Override
						public void onSuccess(@NonNull LogEventResponse t) {
							
							// Field data in class LogEventResponse can be of type Integer, String or JSON
							// Either<Integer, Either<String, Value>>
							Either<String, Value> temp = (Either<String, Value>) t.getData().get(); 
							 
							// Map Linked hashmap data to proper class using jakson mapper 
							ObjectMapper mapper = new ObjectMapper();
							Value value = mapper.convertValue(temp.get(), Value.class);
							 
							result.complete(prefix() + "retrieved  experiment responses; foo response: " + value.getTime());
							
						}

						@Override
						public void onError(@NonNull ErrorResponse error) {
							// TODO Auto-generated method stub
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
