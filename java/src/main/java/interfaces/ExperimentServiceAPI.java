package interfaces;

import java.util.HashMap;
import java.util.List;

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
	Call<List<ExperimentsResponse>> getAllExperiments(@Body HashMap<String, String> body);
	
	@Retry
	@POST("api/mark")
	Call<MarkExperimentPoint> markExperimentPoint(@Body HashMap<String, String> body);
	
	@Retry
	@POST("api/failed")
	Call<FailedExperiment> failedExperimentPoint(@Body HashMap<String, String> body);
	
}
