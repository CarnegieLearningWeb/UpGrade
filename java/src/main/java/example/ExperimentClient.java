package example;

import static utils.Utils.*;

import java.util.List;
import java.util.Map;

import org.eclipse.jdt.annotation.NonNull;

import interfaces.ResponseCallback;
import okhttp3.ResponseBody;
import requestbeans.ExperimentRequest;
import requestbeans.FailedExperimentPointRequest;
import requestbeans.MarkExperimentRequest;
import interfaces.ExperimentServiceAPI;

import responsebeans.ExperimentConditions;
import responsebeans.ExperimentsResponse;
import responsebeans.FailedExperiment;
import responsebeans.GetExperimentCondition;
import responsebeans.InitRequest;
import responsebeans.MarkExperimentPoint;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import utils.ServiceGenerator;
import utils.Utils;

public class ExperimentClient {
	public ExperimentClient() {}

	// Initialize user  with userId and hostUrl
	public void init(String userId, String hostUrl , final ResponseCallback<InitRequest> callbacks) {
		InitRequest initRequest = new InitRequest(userId, null, null);
		userInit(hostUrl,initRequest, callbacks );
	}

	// Initialize user  with userId, hostUrl and group
	public void init(String userId, String hostUrl , Map<String, List<String>> group, final ResponseCallback<InitRequest> callbacks) {
		InitRequest initRequest = new InitRequest(userId, group, null);
		userInit(hostUrl,initRequest, callbacks );
	}

	// Initialize user  with userId, hostUrl and workingGroup
	public void init(String userId, String hostUrl , Map<String, List<String>> group, Map<String, String> workingGroup ,
			final ResponseCallback<InitRequest> callbacks) {
		InitRequest initRequest = new InitRequest(userId, group, workingGroup);
		userInit(hostUrl,initRequest, callbacks );
	}

	// User Initialize request
	public void userInit(String baseUrl, InitRequest initRequest, final ResponseCallback<InitRequest> callbacks) {

		if (!validateInitData(initRequest) || isStringNull(baseUrl)) {
			if (callbacks != null)
				callbacks.validationError(INVALID_INIT_USER_DATA);
			return;
		}
		Utils.BASE_URL = baseUrl;

		ExperimentServiceAPI client = ServiceGenerator.createService(ExperimentServiceAPI.class);
		client.initUser(initRequest).enqueue(new Callback<InitRequest>() {

			@Override
			public void onResponse(Call<InitRequest> call, Response<InitRequest> response) {
				if(response.isSuccessful()) {
					InitRequest reqResponse = response.body();

					if (callbacks != null)
						callbacks.onSuccess(reqResponse);

				} else {
					if (callbacks != null)
						callbacks.onError(response.errorBody());
				}
			}
			@Override
			public void onFailure(Call<InitRequest> call, Throwable t) {
				callbacks.validationError("Request failed finally:  " + t.getMessage());
			}
		});
	}


	// To set user group membership
	public void setGroupMembership(String studentId, Map<String, List<String>> group, final ResponseCallback<InitRequest> callbacks) {

		if (isStringNull(Utils.BASE_URL)) {
			if (callbacks != null)
				callbacks.validationError(INVALID_GROUP_MEMBERSHIP_DATA);
			return;
		}

		InitRequest initRequest = new InitRequest(studentId, group, null);
		ExperimentServiceAPI client = ServiceGenerator.createService(ExperimentServiceAPI.class);
		client.setGroupMemebership(initRequest).enqueue(new Callback<InitRequest>() {

			@Override
			public void onResponse(Call<InitRequest> call, Response<InitRequest> response) {
				if(response.isSuccessful()) {
					if (callbacks != null)
						callbacks.onSuccess(response.body());
				} else {
					if (callbacks != null)
						callbacks.onError(response.errorBody());
				}
			}
			@Override
			public void onFailure(Call<InitRequest> call, Throwable t) {
				callbacks.validationError("Request failed finally:  " + t.getMessage());
			}
		});

	}

	// To set user workingGroup
	public void setWorkingGroup(String studentId, Map<String, String> workingGroup, final ResponseCallback<InitRequest> callbacks) {

		if (isStringNull(Utils.BASE_URL)){
			if (callbacks != null)
				callbacks.validationError(INVALID_WORKING_GROUP_DATA);
			return;
		}

		ExperimentServiceAPI client = ServiceGenerator.createService(ExperimentServiceAPI.class);

		InitRequest initRequest = new InitRequest(studentId, null, workingGroup);
		client.updateWorkingGroup(initRequest).enqueue(new Callback<InitRequest>() {

			@Override
			public void onResponse(Call<InitRequest> call, Response<InitRequest> response) {
				if(response.isSuccessful()) {
					if (callbacks != null)
						callbacks.onSuccess(response.body());
				} else {
					if (callbacks != null)
						callbacks.onError(response.errorBody());
				}
			}
			@Override
			public void onFailure(Call<InitRequest> call, Throwable t) {
				callbacks.validationError("Request failed finally:  " + t.getMessage());
			}
		});

	}

	// To get all Experiments
	public void getAllExperimentCondition(String studentId, String context, final ResponseCallback<List<ExperimentsResponse> > callbacks) {

		if ( isStringNull(studentId) || isStringNull(Utils.BASE_URL) ) {
			if (callbacks != null)
				callbacks.validationError(INVALID_STUDENT_ID);
			return;
		}

		ExperimentServiceAPI client = ServiceGenerator.createService(ExperimentServiceAPI.class);


		ExperimentRequest experimentRequest = new ExperimentRequest(studentId, context );

		client.getAllExperiments(experimentRequest).enqueue(new Callback<List<ExperimentsResponse>>() {

			@Override
			public void onResponse(Call<List<ExperimentsResponse>> call, Response<List<ExperimentsResponse>> response) {
				if(response.isSuccessful()) {
					if (callbacks != null) {
						callbacks.onSuccess(response.body());
					}
				} else {
					if (callbacks != null)
						callbacks.onError(response.errorBody());
				}
			}
			@Override
			public void onFailure(Call<List<ExperimentsResponse>> call, Throwable t) {
				callbacks.validationError("Request failed finally:  " + t.getMessage());
			}
		});
	}

	// To get experiment condition for particular experiment point
	public void getExperimentCondition(String studentId, String experimentPoint, final ResponseCallback<GetExperimentCondition> callbacks) {
		getExperimentCondition(studentId, experimentPoint, "", callbacks);
	}

	// To get experiment condition for particular experiment point and experimentId
	public void getExperimentCondition(String studentId, String experimentPoint, String experimentId, 
			final ResponseCallback<GetExperimentCondition> callbacks) {

		getAllExperimentCondition(studentId, "", new ResponseCallback<List<ExperimentsResponse>>() {
			@Override
			public void onSuccess(@NonNull List<ExperimentsResponse> experiments) {
				if( experiments !=null && experiments.size() > 0) {

					ExperimentsResponse experimentsResponse  = experiments.stream().filter(t -> 
					isStringNull(experimentId) == false ?  t.getName().toString().equals(experimentId) && t.getPoint().equals(experimentPoint) :
						t.getPoint().equals(experimentPoint) && isStringNull(t.getName().toString()) ).findFirst().get();

					ExperimentConditions assignedCondition = new ExperimentConditions(experimentsResponse.getAssignedCondition().getConditionCode(), experimentsResponse.getAssignedCondition().getTwoCharacterId());
					GetExperimentCondition getExperimentCondition = new GetExperimentCondition(experimentsResponse.getName().toString(), experimentsResponse.getPoint(), experimentsResponse.getTwoCharacterId(), assignedCondition);
					if (callbacks != null)
						callbacks.onSuccess(getExperimentCondition) ;

				} else {
					if (callbacks != null)
						callbacks.onSuccess(new GetExperimentCondition());
				}
			}

			@Override
			public void onError(@NonNull ResponseBody responseBody) {
				//System.out.println("Unable to get experiment responses");
				if (callbacks != null)
					callbacks.onError(responseBody);
			}

			@Override
			public void validationError(@NonNull String t) {
				if (callbacks != null)
					callbacks.validationError(t);

			}

		});
	}

	// To mark experiment point
	public void markExperimentPoint(String studentId, final String experimentPoint, final ResponseCallback<MarkExperimentPoint> callbacks) {
		markExperimentPoint(studentId, experimentPoint, "", callbacks);
	}

	// To mark experiment point with experimentPoint and experimentId 
	public void markExperimentPoint(String studentId, final String experimentPoint, String experimentId,
			final ResponseCallback<MarkExperimentPoint> callbacks) {

		if ( isStringNull(experimentPoint) || isStringNull(studentId) || isStringNull(Utils.BASE_URL)) {
			if (callbacks != null)
				callbacks.validationError(INVALID_MARK_EXPERIMENT_DATA);
			return;
		}

		ExperimentServiceAPI client = ServiceGenerator.createService(ExperimentServiceAPI.class);
		MarkExperimentRequest markExperimentRequest = new MarkExperimentRequest(studentId, experimentPoint, experimentId );

		client.markExperimentPoint(markExperimentRequest).enqueue(new Callback<MarkExperimentPoint>() {
			@Override
			public void onResponse(Call<MarkExperimentPoint> call, Response<MarkExperimentPoint> response) {
				if(response.isSuccessful()) {
					if (callbacks != null)
						callbacks.onSuccess(new MarkExperimentPoint(studentId, experimentId, experimentPoint ));
				} else {
					if (callbacks != null)
						callbacks.onError(response.errorBody());
				}
			}

			@Override
			public void onFailure(Call<MarkExperimentPoint> call, Throwable t) {
				callbacks.validationError("Request failed finally:  " + t.getMessage());

			}
		});
	}

	//Failed experiment point 
	public void failedExperimentPoint (final String experimentPoint, final ResponseCallback<FailedExperiment> callbacks) {
		failedExperimentPoint(experimentPoint,"", "", callbacks );
	}

	public void failedExperimentPoint (final String experimentPoint,final String experimentId, final ResponseCallback<FailedExperiment> callbacks) {
		failedExperimentPoint(experimentPoint,experimentId, "", callbacks );
	}

	public void failedExperimentPoint(final String experimentPoint, final String experimentId, final String reason, 
			final ResponseCallback<FailedExperiment> callbacks) {

		if ( isStringNull(experimentPoint) || isStringNull(reason) || isStringNull(Utils.BASE_URL) ) {
			if (callbacks != null)
				callbacks.validationError(INVALID_FAILED_EXPERIMENT_DATA);
			return;
		}

		ExperimentServiceAPI client = ServiceGenerator.createService(ExperimentServiceAPI.class);
		FailedExperimentPointRequest failedExperimentPointRequest = new FailedExperimentPointRequest(experimentPoint, experimentId, reason);

		client.failedExperimentPoint(failedExperimentPointRequest).enqueue(new Callback<FailedExperiment>() {

			@Override
			public void onResponse(Call<FailedExperiment> call, Response<FailedExperiment> response) {
				if(response.isSuccessful()) {
					if (callbacks != null)
						callbacks.onSuccess(new FailedExperiment(response.body().getType(), response.body().getMessage() ));
				} else {
					if (callbacks != null)
						callbacks.onError(response.errorBody());
				}
			}

			@Override
			public void onFailure(Call<FailedExperiment> call, Throwable t) {
				callbacks.validationError("Request failed finally:  " + t.getMessage());

			}
		});

	}
}
