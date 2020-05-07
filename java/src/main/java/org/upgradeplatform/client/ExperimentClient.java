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
import org.upgradeplatform.utils.PublishingRetryCallback;

public class ExperimentClient {

	private List<ExperimentsResponse> allExperiments;
	private final String userId;
	private final APIService apiService;

	public ExperimentClient(String userId, String authToken, String baseUrl) {
        if (isStringNull(userId)) {
            throw new IllegalArgumentException(INVALID_STUDENT_ID);
		}
		this.userId = userId;

		this.apiService = new APIService(baseUrl, authToken);
	}

    // To close jax-rs client connection open when calling ExperimentClient constructor;
    public void close() {
        this.apiService.close();
    }

	public void setGroupMembership(Map<String, List<String>> group, final ResponseCallback<InitRequest> callbacks) {
		// Build a request object and prepare invocation method
		InitRequest initRequest = new InitRequest(this.userId, group, null);
		AsyncInvoker invocation = this.apiService.prepareRequest(SET_GROUP_MEMBERSHIP);
		Entity<InitRequest> requestContent = Entity.json(initRequest);

		// Invoke the method
		invocation.post(requestContent,new PublishingRetryCallback<>(invocation, requestContent, MAX_RETRIES, 
				new InvocationCallback<Response>() {

			@Override
			public void completed(Response response) {
				if (response.getStatus() == Response.Status.OK.getStatusCode()) {
					callbacks.onSuccess(response.readEntity(InitRequest.class));
				} else {
					String status = Response.Status.fromStatusCode(response.getStatus()).toString();
					ErrorResponse error = new ErrorResponse(response.getStatus(), response.readEntity( String.class ), status );
					if (callbacks != null)
						callbacks.onError(error);
				}
			}

			@Override
			public void failed(Throwable throwable) {
				callbacks.onError(new ErrorResponse(throwable.getMessage()));
			}
		}));
	}

	public void setWorkingGroup(Map<String, String> workingGroup, final ResponseCallback<InitRequest> callbacks) {
		InitRequest initRequest = new InitRequest(this.userId, null, workingGroup);
		AsyncInvoker invocation = this.apiService.prepareRequest(SET_WORKING_GROUP);
		Entity<InitRequest> requestContent = Entity.json(initRequest);

		invocation.post(requestContent,new PublishingRetryCallback<>(invocation, requestContent, MAX_RETRIES, 
				new InvocationCallback<Response>() {

			@Override
			public void completed(Response response) {
				if (response.getStatus() == Response.Status.OK.getStatusCode()) {
					callbacks.onSuccess(response.readEntity(InitRequest.class));
				} else {
					String status = Response.Status.fromStatusCode(response.getStatus()).toString();
					ErrorResponse error = new ErrorResponse(response.getStatus(), response.readEntity( String.class ), status );
					if (callbacks != null)
						callbacks.onError(error);
				}
			}

			@Override
			public void failed(Throwable throwable) {
				callbacks.onError(new ErrorResponse(throwable.getMessage()));
			}
		}));
	}

	public void getAllExperimentCondition(String context, final ResponseCallback<List<ExperimentsResponse>> callbacks) {
		ExperimentRequest experimentRequest = new ExperimentRequest(this.userId, context);
		AsyncInvoker invocation = this.apiService.prepareRequest(GET_ALL_EXPERIMENTS);
		Entity<ExperimentRequest> requestContent = Entity.json(experimentRequest);

		invocation.post(requestContent,new PublishingRetryCallback<>(invocation, requestContent, MAX_RETRIES, 
				new InvocationCallback<Response>() {

			@Override
			public void completed(Response response) {
				if (response.getStatus() == Response.Status.OK.getStatusCode()) {
					// Cache allExperiment data for future requests
					allExperiments = response.readEntity(new GenericType<List<ExperimentsResponse>>() {});
					callbacks.onSuccess(allExperiments);
				} else {
					String status = Response.Status.fromStatusCode(response.getStatus()).toString();
					ErrorResponse error = new ErrorResponse(response.getStatus(), response.readEntity( String.class ), status );
					if (callbacks != null)
						callbacks.onError(error);
				}
			}

			@Override
			public void failed(Throwable throwable) {
				callbacks.onError(new ErrorResponse(throwable.getMessage()));
			}

		}));
	}

	public void getExperimentCondition(String experimentPoint, final ResponseCallback<ExperimentsResponse> callbacks) {
		getExperimentCondition(experimentPoint, null, callbacks);
	}

	public void getExperimentCondition(String experimentPoint, String experimentId,
			final ResponseCallback<ExperimentsResponse> callbacks) {
		if (this.allExperiments != null) {

			Optional<ExperimentsResponse> optExperimentsResponse = allExperiments.stream()
					.filter(t -> isStringNull(experimentId) == false
					? t.getExpId().toString().equals(experimentId) && t.getExpPoint().equals(experimentPoint)
							: t.getExpPoint().equals(experimentPoint) && isStringNull(t.getExpId().toString()))
					.findFirst();

			if( ! optExperimentsResponse.isPresent()) {
				if (callbacks != null) {
					callbacks.onSuccess(new ExperimentsResponse());
			}
				return;
			}
			ExperimentsResponse experimentsResponse = optExperimentsResponse.get();

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

	public void markExperimentPoint(final String experimentPoint,
			final ResponseCallback<MarkExperimentPoint> callbacks) {
		markExperimentPoint(experimentPoint, "", callbacks);
	}

	public void markExperimentPoint(final String experimentPoint, String experimentId,
			final ResponseCallback<MarkExperimentPoint> callbacks) {
		MarkExperimentRequest markExperimentRequest = new MarkExperimentRequest(this.userId, experimentPoint,
				experimentId);
		AsyncInvoker invocation = this.apiService.prepareRequest(MARK_EXPERIMENT_POINT);

		Entity<MarkExperimentRequest> requestContent = Entity.json(markExperimentRequest);

		// Invoke the method
		invocation.post(requestContent,new PublishingRetryCallback<>(invocation, requestContent, MAX_RETRIES, 
				new InvocationCallback<Response>() {

			@Override
			public void completed(Response response) {
				if (response.getStatus() == Response.Status.OK.getStatusCode()) {

					MarkExperimentPoint data = response.readEntity(MarkExperimentPoint.class);
					callbacks.onSuccess(new MarkExperimentPoint(data.getUserId(), experimentId, experimentPoint));
				} else {
					String status = Response.Status.fromStatusCode(response.getStatus()).toString();
					ErrorResponse error = new ErrorResponse(response.getStatus(), response.readEntity( String.class ), status );
					if (callbacks != null)
						callbacks.onError(error);
				}
			}

			@Override
			public void failed(Throwable throwable) {
				callbacks.onError(new ErrorResponse(throwable.getMessage()));
			}
		}));

	}

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
		FailedExperimentPointRequest failedExperimentPointRequest = new FailedExperimentPointRequest(this.userId,
				experimentPoint, experimentId, reason);
		AsyncInvoker invocation = this.apiService.prepareRequest(FAILED_EXPERIMENT_POINT);

		Entity<FailedExperimentPointRequest> requestContent = Entity.json(failedExperimentPointRequest);

		// Invoke the method
		invocation.post(requestContent,new PublishingRetryCallback<>(invocation, requestContent, MAX_RETRIES, 
				new InvocationCallback<Response>() {

			@Override
			public void completed(Response response) {
				if (response.getStatus() == Response.Status.OK.getStatusCode()) {
					callbacks.onSuccess(response.readEntity(FailedExperiment.class));
				} else {
					String status = Response.Status.fromStatusCode(response.getStatus()).toString();
					ErrorResponse error = new ErrorResponse(response.getStatus(), response.readEntity( String.class ), status );
					if (callbacks != null)
						callbacks.onError(error);
				}
			}

			@Override
			public void failed(Throwable throwable) {
				callbacks.onError(new ErrorResponse(throwable.getMessage()));
			}
		}));

	}
}
