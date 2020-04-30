package org.upgradeplatform.interfaces;

import java.util.List;

import org.upgradeplatform.requestbeans.ExperimentRequest;
import org.upgradeplatform.requestbeans.FailedExperimentPointRequest;
import org.upgradeplatform.requestbeans.MarkExperimentRequest;
import org.upgradeplatform.responsebeans.ExperimentsResponse;
import org.upgradeplatform.responsebeans.FailedExperiment;
import org.upgradeplatform.responsebeans.InitRequest;
import org.upgradeplatform.responsebeans.MarkExperimentPoint;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.Header;
import retrofit2.http.POST;

public interface ExperimentServiceAPI {
	
	@Retry
	@POST("api/groupmembership")
	Call<InitRequest> setGroupMemebership(@Header("Authorization") String authToken, @Body InitRequest initRequest);
	
	@Retry
	@POST("api/workinggroup")
	Call<InitRequest> updateWorkingGroup(@Header("Authorization") String authToken, @Body InitRequest initRequest);
	
	@Retry
	@POST("api/assign")
	Call<List<ExperimentsResponse>> getAllExperiments(@Header("Authorization") String authToken, @Body ExperimentRequest experimentRequest);
	
	@Retry
	@POST("api/mark")
	Call<MarkExperimentPoint> markExperimentPoint(@Header("Authorization") String authToken, @Body MarkExperimentRequest markExperimentRequest);
	
	@Retry
	@POST("api/failed")
	Call<FailedExperiment> failedExperimentPoint(@Header("Authorization") String authToken, @Body FailedExperimentPointRequest failedExperimentPointRequest);

	
}
