package org.upgradeplatform.client;

import static org.upgradeplatform.utils.Utils.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import javax.ws.rs.client.AsyncInvoker;
import javax.ws.rs.client.Entity;
import javax.ws.rs.client.InvocationCallback;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;

import org.eclipse.jdt.annotation.NonNull;
import org.upgradeplatform.interfaces.ResponseCallback;
import org.upgradeplatform.requestbeans.ExperimentRequest;
import org.upgradeplatform.requestbeans.FailedExperimentPointRequest;
import org.upgradeplatform.requestbeans.MarkExperimentRequest;
import org.upgradeplatform.responsebeans.AssignedCondition;
import org.upgradeplatform.responsebeans.ErrorResponse;
import org.upgradeplatform.responsebeans.ExperimentsResponse;
import org.upgradeplatform.responsebeans.FailedExperiment;
import org.upgradeplatform.responsebeans.InitRequest;
import org.upgradeplatform.responsebeans.MarkExperimentPoint;
import org.upgradeplatform.utils.APIService;

public class ExperimentClient {

	private List<ExperimentsResponse> allExperiments;
	private String userId;
	APIService apiService;

	public ExperimentClient(String userId, String authToken, String baseUrl) {
		this.userId = userId;
		this.apiService = new APIService(baseUrl, authToken);
	}

	private String validateRequestData(String userId, String authToken, String baseUrl) {
		if (isStringNull(baseUrl)) {
			return INVALID_BASE_URL;
		} else if (isStringNull(authToken)) {
			return INVALID_AUTH_TOKEN;
		} else if (isStringNull(authToken)) {
			return INVALID_STUDENT_ID;
		}

		return "";
	}

	// To set user group membership
	public void setGroupMembership(Map<String, List<String>> group, final ResponseCallback<InitRequest> callbacks) {

		// Check if request has a valid data
		String validateData = validateRequestData(this.userId, this.apiService.getAuthToken(),
				this.apiService.getBaseUrl());
		if (validateData != "") {
			callbacks.onError(new ErrorResponse(validateData));
			return;
		}

		// Build a request object and prepare invocation method
		InitRequest initRequest = new InitRequest(this.userId, group, null);
		AsyncInvoker invocation = this.apiService.prepareRequest(SET_GROUP_MEMBERSHIP);

		// Invoke the method
		invocation.post(Entity.json(initRequest), new InvocationCallback<Response>() {

			@Override
			public void completed(Response response) {
				if (response.getStatus() == Response.Status.OK.getStatusCode()) {
					callbacks.onSuccess(response.readEntity(InitRequest.class));
				} else {
					//System.out.println("set group membdership error.");
					if (callbacks != null)
						callbacks.onError(new ErrorResponse(response.getStatus(),"Error accessing API"));
				}
			}

			@Override
			public void failed(Throwable throwable) {
				callbacks.onError(new ErrorResponse(throwable.getMessage()));
			}
		});

	}

	public void setWorkingGroup(Map<String, String> workingGroup, final ResponseCallback<InitRequest> callbacks) {

		// Check if request has a valid data
		String validateData = validateRequestData(this.userId, this.apiService.getAuthToken(),
				this.apiService.getBaseUrl());
		if (validateData != "") {
			callbacks.onError(new ErrorResponse(validateData));
			return;
		}

		InitRequest initRequest = new InitRequest(this.userId, null, workingGroup);
		AsyncInvoker invocation = this.apiService.prepareRequest(SET_WORKING_GROUP);

		// Invoke the method
		invocation.post(Entity.json(initRequest), new InvocationCallback<Response>() {

			@Override
			public void completed(Response response) {
				if (response.getStatus() == Response.Status.OK.getStatusCode()) {
					callbacks.onSuccess(response.readEntity(InitRequest.class));
				} else {
					if (callbacks != null)
						callbacks.onError(new ErrorResponse(response.getStatus(),"Error accessing API"));
				}
			}

			@Override
			public void failed(Throwable throwable) {
				callbacks.onError(new ErrorResponse(throwable.getMessage()));
			}
		});
	}

	public void getAllExperimentCondition(String context, final ResponseCallback<List<ExperimentsResponse>> callbacks) {

		// Check if request has a valid data
		String validateData = validateRequestData(this.userId, this.apiService.getAuthToken(),
				this.apiService.getBaseUrl());
		if (validateData != "") {
			callbacks.onError(new ErrorResponse(validateData));
			return;
		}

		ExperimentRequest experimentRequest = new ExperimentRequest(this.userId, context);
		AsyncInvoker invocation = this.apiService.prepareRequest(GET_ALL_EXPERIMENTS);

		invocation.post(Entity.json(experimentRequest), new InvocationCallback<Response>() {

			@Override
			public void completed(Response response) {
				if (response.getStatus() == Response.Status.OK.getStatusCode()) {
					// Cache allExperiment data for future requests
					allExperiments = response.readEntity(new GenericType<List<ExperimentsResponse>>() {
					});
					callbacks.onSuccess(allExperiments);
				} else {
					if (callbacks != null)
						callbacks.onError(new ErrorResponse(response.getStatus(),"Error accessing API"));
				}
			}

			@Override
			public void failed(Throwable throwable) {
				throwable.printStackTrace();

			}
		});
	}

	// To get experiment condition for particular experiment point
	public void getExperimentCondition(String experimentPoint, final ResponseCallback<ExperimentsResponse> callbacks) {
		getExperimentCondition(experimentPoint, null, callbacks);
	}

	// To get experiment condition for particular experiment point and experimentId
	public void getExperimentCondition(String experimentPoint, String experimentId,
			final ResponseCallback<ExperimentsResponse> callbacks) {

		// Check if request has a valid data
		String validateData = validateRequestData(this.userId, this.apiService.getAuthToken(),
				this.apiService.getBaseUrl());
		if (validateData != "") {
			callbacks.onError(new ErrorResponse(validateData));
			return;
		}

		if (this.allExperiments != null) {

			ExperimentsResponse experimentsResponse = allExperiments.stream()
					.filter(t -> isStringNull(experimentId) == false
					? t.getExpId().toString().equals(experimentId) && t.getExpPoint().equals(experimentPoint)
							: t.getExpPoint().equals(experimentPoint) && isStringNull(t.getExpId().toString()))
					.findFirst().get();

			if(experimentsResponse == null) {
				if (callbacks != null)
					callbacks.onSuccess(new ExperimentsResponse());
			}

			AssignedCondition assignedCondition = new AssignedCondition(
					experimentsResponse.getAssignedCondition().getTwoCharacterId(),
					experimentsResponse.getAssignedCondition().getConditionCode(),
					experimentsResponse.getAssignedCondition().getDescription());

			ExperimentsResponse resultCondition = new ExperimentsResponse(experimentsResponse.getExpId().toString(),
					experimentsResponse.getExpPoint(), experimentsResponse.getTwoCharacterId(), assignedCondition);

			if (callbacks != null)
				callbacks.onSuccess(resultCondition);
		} else {
			getAllExperimentCondition("", new ResponseCallback<List<ExperimentsResponse>>() {
				@Override
				public void onSuccess(@NonNull List<ExperimentsResponse> experiments) {

					if (experiments != null && experiments.size() > 0) {

						Optional<ExperimentsResponse> result = experiments.stream()
								.filter(t -> isStringNull(experimentId) == false
								? t.getExpId().toString().equals(experimentId)
										&& t.getExpPoint().equals(experimentPoint)
										: t.getExpPoint().equals(experimentPoint)
										&& isStringNull(t.getExpId().toString()))
								.findFirst();

						if (result.isPresent()) {
							ExperimentsResponse experimentsResponse = result.get();

							AssignedCondition assignedCondition = new AssignedCondition(
									experimentsResponse.getAssignedCondition().getTwoCharacterId(),
									experimentsResponse.getAssignedCondition().getConditionCode(),
									experimentsResponse.getAssignedCondition().getDescription());

							ExperimentsResponse resultCondition = new ExperimentsResponse(
									experimentsResponse.getExpId().toString(), experimentsResponse.getExpPoint(),
									experimentsResponse.getTwoCharacterId(), assignedCondition);

							if (callbacks != null)
								callbacks.onSuccess(resultCondition);
						} else {
							if (callbacks != null)
								callbacks.onSuccess(new ExperimentsResponse());
						}
					} else {
						if (callbacks != null)
							callbacks.onSuccess(new ExperimentsResponse());
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
	public void markExperimentPoint(final String experimentPoint,
			final ResponseCallback<MarkExperimentPoint> callbacks) {
		markExperimentPoint(experimentPoint, "", callbacks);
	}

	// To mark experiment point with experimentPoint and experimentId
	public void markExperimentPoint(final String experimentPoint, String experimentId,
			final ResponseCallback<MarkExperimentPoint> callbacks) {

		// Check if request has a valid data
		String validateData = validateRequestData(this.userId, this.apiService.getAuthToken(),
				this.apiService.getBaseUrl());
		if (validateData != "") {
			callbacks.onError(new ErrorResponse(validateData));
			return;
		}

		MarkExperimentRequest markExperimentRequest = new MarkExperimentRequest(this.userId, experimentPoint,
				experimentId);
		AsyncInvoker invocation = this.apiService.prepareRequest(MARK_EXPERIMENT_POINT);
		// Invoke the method
		invocation.post(Entity.json(markExperimentRequest), new InvocationCallback<Response>() {
			@Override
			public void completed(Response response) {
				if (response.getStatus() == Response.Status.OK.getStatusCode()) {

					MarkExperimentPoint data = response.readEntity(MarkExperimentPoint.class);
					callbacks.onSuccess(new MarkExperimentPoint(data.getUserId(), experimentId, experimentPoint));
				} else {
					if (callbacks != null)
						callbacks.onError(new ErrorResponse(response.getStatus(),"Error accessing API"));
				}
			}

			@Override
			public void failed(Throwable throwable) {
				callbacks.onError(new ErrorResponse(throwable.getMessage()));
			}
		});

	}

	// Failed experiment point
	public void failedExperimentPoint(final String experimentPoint,
			final ResponseCallback<FailedExperiment> callbacks) {
		failedExperimentPoint(experimentPoint, "", "", callbacks);
	}

	public void failedExperimentPoint(final String experimentPoint, final String experimentId,
			final ResponseCallback<FailedExperiment> callbacks) {
		failedExperimentPoint(experimentPoint, experimentId, "", callbacks);
	}

	public void failedExperimentPoint(final String experimentPoint, final String experimentId, final String reason,
			final ResponseCallback<FailedExperiment> callbacks) {

		// Check if request has a valid data
		String validateData = validateRequestData(this.userId, this.apiService.getAuthToken(),
				this.apiService.getBaseUrl());
		if (validateData != "") {
			callbacks.onError(new ErrorResponse(validateData));
			return;
		}

		FailedExperimentPointRequest failedExperimentPointRequest = new FailedExperimentPointRequest(this.userId,
				experimentPoint, experimentId, reason);
		AsyncInvoker invocation = this.apiService.prepareRequest(FAILED_EXPERIMENT_POINT);

		// Invoke the method
		invocation.post(Entity.json(failedExperimentPointRequest), new InvocationCallback<Response>() {

			@Override
			public void completed(Response response) {
				if (response.getStatus() == Response.Status.OK.getStatusCode()) {
					callbacks.onSuccess(response.readEntity(FailedExperiment.class));
				} else {
					if (callbacks != null)
						callbacks.onError(new ErrorResponse(response.getStatus(),"Error accessing API"));
				}
			}

			@Override
			public void failed(Throwable throwable) {
				callbacks.onError(new ErrorResponse(throwable.getMessage()));
			}
		});

	}
}
