package org.upgradeplatform.client;

import static org.upgradeplatform.utils.Utils.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.eclipse.jdt.annotation.NonNull;
import org.upgradeplatform.interfaces.ExperimentServiceAPI;
import org.upgradeplatform.interfaces.ResponseCallback;
import org.upgradeplatform.requestbeans.ExperimentRequest;
import org.upgradeplatform.requestbeans.FailedExperimentPointRequest;
import org.upgradeplatform.requestbeans.MarkExperimentRequest;
import org.upgradeplatform.responsebeans.ErrorResponse;
import org.upgradeplatform.responsebeans.ExperimentConditions;
import org.upgradeplatform.responsebeans.ExperimentsResponse;
import org.upgradeplatform.responsebeans.FailedExperiment;
import org.upgradeplatform.responsebeans.GetExperimentCondition;
import org.upgradeplatform.responsebeans.InitRequest;
import org.upgradeplatform.responsebeans.MarkExperimentPoint;
import org.upgradeplatform.utils.ErrorUtils;
import org.upgradeplatform.utils.ServiceGenerator;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ExperimentClient {

	private List<ExperimentsResponse> allExperiments;
	private String userId;
	private String authToken;
	private String baseUrl;
	
	public ExperimentClient(String userId, String authToken, String baseUrl) {
		this.userId = userId;
		this.authToken = authToken;
		this.baseUrl = baseUrl;
	}
	

	private String validateRequestData(String userId, String authToken, String baseUrl) {
		if (isStringNull(this.baseUrl)) {
			return INVALID_BASE_URL;
		} else if (isStringNull(this.authToken)) {
			return INVALID_AUTH_TOKEN;
		} else if (isStringNull(this.authToken)) {
			return INVALID_STUDENT_ID;
		}
		
		return "";
	}

	// To set user group membership
	public void setGroupMembership(Map<String, List<String>> group, final ResponseCallback<InitRequest> callbacks) {

		String validateData = validateRequestData(this.userId, this.authToken, this.baseUrl);
		if(validateData != "") {
			callbacks.onError(new ErrorResponse(validateData));
			return;
		}

		InitRequest initRequest = new InitRequest(this.userId, group, null);
		ExperimentServiceAPI client = ServiceGenerator.createService(ExperimentServiceAPI.class, this.baseUrl);
		client.setGroupMemebership( "Bearer "+this.authToken , initRequest).enqueue(new Callback<InitRequest>() {

			@Override
			public void onResponse(Call<InitRequest> call, Response<InitRequest> response) {
				if(response.isSuccessful()) {
					if (callbacks != null)
						callbacks.onSuccess(response.body());
				} else {
					ErrorResponse error = ErrorUtils.parseError(response);

					if (callbacks != null)
						callbacks.onError(error);
				}
			}
			@Override
			public void onFailure(Call<InitRequest> call, Throwable t) {
				callbacks.onError(new ErrorResponse(t.getMessage()));
			}
		});

	}

	// To set user workingGroup
	public void setWorkingGroup(Map<String, String> workingGroup, final ResponseCallback<InitRequest> callbacks) {

		String validateData = validateRequestData(this.userId, this.authToken, this.baseUrl);
		if(validateData != "") {
			callbacks.onError(new ErrorResponse(validateData));
			return;
		}
		
		ExperimentServiceAPI client = ServiceGenerator.createService(ExperimentServiceAPI.class, this.baseUrl);

		InitRequest initRequest = new InitRequest(this.userId, null, workingGroup);
		client.updateWorkingGroup("Bearer "+this.authToken ,initRequest).enqueue(new Callback<InitRequest>() {

			@Override
			public void onResponse(Call<InitRequest> call, Response<InitRequest> response) {
				if(response.isSuccessful()) {
					if (callbacks != null)
						callbacks.onSuccess(response.body());
				} else {
					ErrorResponse error = ErrorUtils.parseError(response);

					if (callbacks != null)
						callbacks.onError(error);
				}
			}
			@Override
			public void onFailure(Call<InitRequest> call, Throwable t) {
				callbacks.onError(new ErrorResponse(t.getMessage()) );
			}
		});

	}

	// To get all Experiments
	public void getAllExperimentCondition(String context, final ResponseCallback<List<ExperimentsResponse> > callbacks) {

		String validateData = validateRequestData(this.userId, this.authToken, this.baseUrl);
		if(validateData != "") {
			callbacks.onError(new ErrorResponse(validateData));
			return;
		}

		ExperimentServiceAPI client = ServiceGenerator.createService(ExperimentServiceAPI.class, this.baseUrl);


		ExperimentRequest experimentRequest = new ExperimentRequest(this.userId, context );

		client.getAllExperiments("Bearer "+this.authToken, experimentRequest).enqueue(new Callback<List<ExperimentsResponse>>() {

			@Override
			public void onResponse(Call<List<ExperimentsResponse>> call, Response<List<ExperimentsResponse>> response) {
				if(response.isSuccessful()) {
					if (callbacks != null) {
						allExperiments = response.body();
						callbacks.onSuccess(response.body());
					}
				} else {
					ErrorResponse error = ErrorUtils.parseError(response);
					if (callbacks != null)
						callbacks.onError(error);
				}
			}
			@Override
			public void onFailure(Call<List<ExperimentsResponse>> call, Throwable t) {
				callbacks.onError(new ErrorResponse(t.getMessage()));
			}
		});
	}

	// To get experiment condition for particular experiment point
	public void getExperimentCondition(String experimentPoint, final ResponseCallback<GetExperimentCondition> callbacks) {
		getExperimentCondition(experimentPoint, null, callbacks);
	}

	// To get experiment condition for particular experiment point and experimentId
	public void getExperimentCondition(String experimentPoint, String experimentId, 
			final ResponseCallback<GetExperimentCondition> callbacks) {
		
		String validateData = validateRequestData(this.userId, this.authToken, this.baseUrl);
		if(validateData != "") {
			callbacks.onError(new ErrorResponse(validateData));
			return;
		}
		
		if (this.allExperiments != null) {

			ExperimentsResponse experimentsResponse  = allExperiments.stream().filter(t -> 
			isStringNull(experimentId) == false ?  t.getName().toString().equals(experimentId) && t.getPoint().equals(experimentPoint) :
				t.getPoint().equals(experimentPoint) && isStringNull(t.getName().toString()) ).findFirst().get();

			ExperimentConditions assignedCondition = new ExperimentConditions(experimentsResponse.getAssignedCondition().getConditionCode(), experimentsResponse.getAssignedCondition().getTwoCharacterId());
			GetExperimentCondition getExperimentCondition = new GetExperimentCondition(experimentsResponse.getName().toString(), experimentsResponse.getPoint(), experimentsResponse.getTwoCharacterId(), assignedCondition);

			if (callbacks != null)
				callbacks.onSuccess(getExperimentCondition) ;
		} else {
			getAllExperimentCondition("", new ResponseCallback<List<ExperimentsResponse>>() {
				@Override
				public void onSuccess(@NonNull List<ExperimentsResponse> experiments) {
					if( experiments !=null && experiments.size() > 0) {

						Optional<ExperimentsResponse> result = experiments.stream().filter(t -> 
						isStringNull(experimentId) == false ? 
								t.getName().toString().equals(experimentId) && t.getPoint().equals(experimentPoint) :
									t.getPoint().equals(experimentPoint) && isStringNull(t.getName().toString()))
								.findFirst();

				
						if (result.isPresent()) {
							ExperimentsResponse experimentsResponse =  result.get();
							ExperimentConditions assignedCondition = new ExperimentConditions(experimentsResponse.getAssignedCondition().getConditionCode(), experimentsResponse.getAssignedCondition().getTwoCharacterId());
							GetExperimentCondition getExperimentCondition = new GetExperimentCondition(experimentsResponse.getName().toString(), experimentsResponse.getPoint(), experimentsResponse.getTwoCharacterId(), assignedCondition);
						
							if (callbacks != null)
								callbacks.onSuccess(getExperimentCondition) ;
						} else {
							if (callbacks != null)
								callbacks.onSuccess(new GetExperimentCondition());
						}
					} else {
						if (callbacks != null)
							callbacks.onSuccess(new GetExperimentCondition());
					}
				}

				@Override
				public void onError(@NonNull ErrorResponse error) {
					if (callbacks != null)
						callbacks.onError(error);

				}

			});
		}
	}

	// To mark experiment point
	public void markExperimentPoint(final String experimentPoint, final ResponseCallback<MarkExperimentPoint> callbacks) {
		markExperimentPoint(experimentPoint, "", callbacks);
	}

	// To mark experiment point with experimentPoint and experimentId 
	public void markExperimentPoint(final String experimentPoint, String experimentId,
			final ResponseCallback<MarkExperimentPoint> callbacks) {

		String validateData = validateRequestData(this.userId, this.authToken, this.baseUrl);
		if(validateData != "") {
			callbacks.onError(new ErrorResponse(validateData));
			return;
		}

		ExperimentServiceAPI client = ServiceGenerator.createService(ExperimentServiceAPI.class, this.baseUrl);
		MarkExperimentRequest markExperimentRequest = new MarkExperimentRequest(this.userId, experimentPoint, experimentId );

		client.markExperimentPoint("Bearer "+this.authToken ,markExperimentRequest).enqueue(new Callback<MarkExperimentPoint>() {

			@Override
			public void onResponse(Call<MarkExperimentPoint> call, Response<MarkExperimentPoint> response) {
				if(response.isSuccessful()) {
					if (callbacks != null)
						callbacks.onSuccess(new MarkExperimentPoint(response.body().getUserId(), experimentId, experimentPoint ));
				} else {
					ErrorResponse error = ErrorUtils.parseError(response);

					if (callbacks != null)
						callbacks.onError(error);
				}
			}

			@Override
			public void onFailure(Call<MarkExperimentPoint> call, Throwable t) {
				callbacks.onError(new ErrorResponse(t.getMessage()));

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

		String validateData = validateRequestData(this.userId, this.authToken, this.baseUrl);
		if(validateData != "") {
			callbacks.onError(new ErrorResponse(validateData));
			return;
		}

		ExperimentServiceAPI client = ServiceGenerator.createService(ExperimentServiceAPI.class, this.baseUrl);
		FailedExperimentPointRequest failedExperimentPointRequest = new FailedExperimentPointRequest(experimentPoint, experimentId, reason);

		client.failedExperimentPoint("Bearer "+this.authToken, failedExperimentPointRequest).enqueue(new Callback<FailedExperiment>() {

			@Override
			public void onResponse(Call<FailedExperiment> call, Response<FailedExperiment> response) {
				if(response.isSuccessful()) {
					if (callbacks != null)
						callbacks.onSuccess(new FailedExperiment(response.body().getType(), response.body().getMessage() ));
				} else {
					ErrorResponse error = ErrorUtils.parseError(response);

					if (callbacks != null)
						callbacks.onError(error);
				}
			}

			@Override
			public void onFailure(Call<FailedExperiment> call, Throwable t) {
				callbacks.onError(new ErrorResponse(t.getMessage()));
			}
		});

	}
}
