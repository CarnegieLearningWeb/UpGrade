package interfaces;

import java.util.List;
import java.util.Map;

import requestbeans.ExperimentRequest;
import requestbeans.FailedExperimentPointRequest;
import requestbeans.MarkExperimentRequest;
import responsebeans.ExperimentsResponse;
import responsebeans.FailedExperiment;
import responsebeans.InitRequest;
import responsebeans.MarkExperimentPoint;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.POST;

public interface ExperimentServiceAPI {

	@Retry
	@POST("api/init")
	Call<InitRequest> initUser(@Body InitRequest initRequest);
	
	@Retry
	@POST("api/groupmembership")
	Call<InitRequest> setGroupMemebership(@Body InitRequest initRequest);
	
	@Retry
	@POST("api/workinggroup")
	Call<InitRequest> updateWorkingGroup(@Body InitRequest initRequest);
	
	@Retry
	@POST("api/assign")
	Call<List<ExperimentsResponse>> getAllExperiments(@Body ExperimentRequest experimentRequest);
	
	@Retry
	@POST("api/mark")
	Call<MarkExperimentPoint> markExperimentPoint(@Body MarkExperimentRequest markExperimentRequest);
	
	@Retry
	@POST("api/failed")
	Call<FailedExperiment> failedExperimentPoint(@Body FailedExperimentPointRequest failedExperimentPointRequest);

	
}
