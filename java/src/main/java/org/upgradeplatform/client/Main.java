package org.upgradeplatform.client;


import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

import org.eclipse.jdt.annotation.NonNull;
import org.upgradeplatform.interfaces.ResponseCallback;
import org.upgradeplatform.responsebeans.ErrorResponse;
import org.upgradeplatform.responsebeans.ExperimentsResponse;



public class Main {
	public static void main(String []args) throws InterruptedException
	{
		String baseUrl = "http://development-upgrade-experiment-app.eba-gp6psjut.us-east-1.elasticbeanstalk.com";
		String userId = "user1";
	
		
		String[] classList = {"1","2","3","4","5"};
		String[] teacherList = {"1","2","7"};
		
		HashMap<String, List<String>> group = new HashMap<String, List<String>>();
		group.put("classes", Arrays.asList(classList));
		group.put("teachers", Arrays.asList(teacherList));
		
		ExperimentClient experimentClient = new ExperimentClient(userId, "BearerToken", baseUrl);
		
		
		experimentClient.getAllExperimentCondition("addition hard", new ResponseCallback<List<ExperimentsResponse>>() {

			@Override
			public void onSuccess(@NonNull List<ExperimentsResponse> t) {
				System.out.println(t.size());
				
				//to Close jax-rs client
				experimentClient.close();
			}

			@Override
			public void onError(@NonNull ErrorResponse error) {
				// TODO Auto-generated method stub
				
			}
		});
	}
}
