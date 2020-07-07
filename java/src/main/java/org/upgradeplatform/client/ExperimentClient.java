package org.upgradeplatform.client;

import static org.upgradeplatform.utils.Utils.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import javax.ws.rs.client.AsyncInvoker;
import javax.ws.rs.client.Entity;
import javax.ws.rs.client.InvocationCallback;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;

import org.eclipse.jdt.annotation.NonNull;
import org.upgradeplatform.interfaces.ResponseCallback;
import org.upgradeplatform.requestbeans.ExperimentRequest;
import org.upgradeplatform.requestbeans.FailedExperimentPointRequest;
import org.upgradeplatform.requestbeans.GroupMetric;
import org.upgradeplatform.requestbeans.LogInput;
import org.upgradeplatform.requestbeans.LogRequest;
import org.upgradeplatform.requestbeans.MarkExperimentRequest;
import org.upgradeplatform.requestbeans.MetricUnitBody;
import org.upgradeplatform.requestbeans.SingleMetric;
import org.upgradeplatform.requestbeans.UserAlias;
import org.upgradeplatform.responsebeans.AssignedCondition;
import org.upgradeplatform.responsebeans.ErrorResponse;
import org.upgradeplatform.responsebeans.ExperimentsResponse;
import org.upgradeplatform.responsebeans.FailedExperiment;
import org.upgradeplatform.responsebeans.FeatureFlag;
import org.upgradeplatform.responsebeans.ExperimentUser;
import org.upgradeplatform.responsebeans.LogEventResponse;
import org.upgradeplatform.responsebeans.MarkExperimentPoint;
import org.upgradeplatform.responsebeans.Metric;
import org.upgradeplatform.responsebeans.Variation;
import org.upgradeplatform.utils.APIService;
import org.upgradeplatform.utils.PublishingRetryCallback;



public class ExperimentClient implements AutoCloseable {

	private List<ExperimentsResponse> allExperiments;
	private List<FeatureFlag> allFeatureFlag;
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
	@Override
	public void close() {
		this.apiService.close();
	}

	public void setGroupMembership(Map<String, List<String>> group, final ResponseCallback<ExperimentUser> callbacks) {
		// Build a request object and prepare invocation method
		ExperimentUser experimentUser = new ExperimentUser(this.userId, group, null);
		AsyncInvoker invocation = this.apiService.prepareRequest(SET_GROUP_MEMBERSHIP);
		Entity<ExperimentUser> requestContent = Entity.json(experimentUser);

		// Invoke the method
		invocation.post(requestContent,new PublishingRetryCallback<>(invocation, requestContent, MAX_RETRIES,RequestType.POST, 
				new InvocationCallback<Response>() {

			@Override
			public void completed(Response response) {
				if (response.getStatus() == Response.Status.OK.getStatusCode()) {
					callbacks.onSuccess(response.readEntity(ExperimentUser.class));
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

	public void setWorkingGroup(Map<String, String> workingGroup, final ResponseCallback<ExperimentUser> callbacks) {
		ExperimentUser experimentUser = new ExperimentUser(this.userId, null, workingGroup);
		AsyncInvoker invocation = this.apiService.prepareRequest(SET_WORKING_GROUP);
		Entity<ExperimentUser> requestContent = Entity.json(experimentUser);

		invocation.post(requestContent,new PublishingRetryCallback<>(invocation, requestContent, MAX_RETRIES, RequestType.POST,
				new InvocationCallback<Response>() {

			@Override
			public void completed(Response response) {
				if (response.getStatus() == Response.Status.OK.getStatusCode()) {
					callbacks.onSuccess(response.readEntity(ExperimentUser.class));
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

		invocation.post(requestContent,new PublishingRetryCallback<>(invocation, requestContent, MAX_RETRIES, RequestType.POST,
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

			ExperimentsResponse resultCondition = findExperimentResponse(experimentPoint, experimentId, allExperiments);

			if (callbacks != null) {
				callbacks.onSuccess(resultCondition);
			}
		} else {
			getAllExperimentCondition("", new ResponseCallback<List<ExperimentsResponse>>() {
				@Override
				public void onSuccess(@NonNull List<ExperimentsResponse> experiments) {

					ExperimentsResponse resultCondition = findExperimentResponse(experimentPoint, experimentId, experiments);

					if (callbacks != null) {
						callbacks.onSuccess(resultCondition);
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

	private ExperimentsResponse findExperimentResponse(String experimentPoint, String experimentId,
			List<ExperimentsResponse> experiments) {
		return experiments.stream()
				.filter(t -> t.getExpPoint().equals(experimentPoint) &&
						(isStringNull(experimentId) ? isStringNull(t.getExpId().toString())
								: t.getExpId().toString().equals(experimentId)))
				.findFirst()
				.map(ExperimentClient::copyExperimentResponse)
				.orElse(new ExperimentsResponse());
	}

	private static ExperimentsResponse copyExperimentResponse(ExperimentsResponse experimentsResponse) {
		AssignedCondition assignedCondition = new AssignedCondition(
				experimentsResponse.getAssignedCondition().getTwoCharacterId(),
				experimentsResponse.getAssignedCondition().getConditionCode(),
				experimentsResponse.getAssignedCondition().getDescription());

		ExperimentsResponse resultCondition = new ExperimentsResponse(experimentsResponse.getExpId().toString(),
				experimentsResponse.getExpPoint(), experimentsResponse.getTwoCharacterId(), assignedCondition);
		return resultCondition;
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
		invocation.post(requestContent,new PublishingRetryCallback<>(invocation, requestContent, MAX_RETRIES, RequestType.POST,
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
		invocation.post(requestContent,new PublishingRetryCallback<>(invocation, requestContent, MAX_RETRIES, RequestType.POST,
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

	public void getAllFeatureFlags(final ResponseCallback<List<FeatureFlag>> callbacks) {

		AsyncInvoker invocation = this.apiService.prepareRequest(GET_ALL_FEATURE_FLAGS);

		invocation.get(new PublishingRetryCallback<>(invocation, MAX_RETRIES, RequestType.GET,new InvocationCallback<Response>() {

			@Override
			public void completed(Response response) {
				if (response.getStatus() == Response.Status.OK.getStatusCode()) {
					allFeatureFlag = response.readEntity(new GenericType<List<FeatureFlag>>() {});
					callbacks.onSuccess(allFeatureFlag);

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

	public void getFeatureFlag(String key, final ResponseCallback<FeatureFlag> callbacks) {
		if (this.allFeatureFlag != null) {

			FeatureFlag result = findFeatureFlag(key, allFeatureFlag);

			if (callbacks != null) {
				callbacks.onSuccess(result);
			}
		} else {
			throw new IllegalArgumentException(FEATURE_FLAGS_EMPTY);
		}
	}

	private FeatureFlag findFeatureFlag(String key, List<FeatureFlag> featureFlags) {
		FeatureFlag featureFlag = featureFlags.stream()
				.filter(t -> t.getKey().equals(key))
				.findFirst()
				.orElse(new FeatureFlag());

		return getActiveVariation(featureFlag);
	}

	private FeatureFlag getActiveVariation(FeatureFlag featureFlag) {

		if(isStringNull(featureFlag.getId())) {
			return featureFlag;
		}

		FeatureFlag resultFeatureFlag = new FeatureFlag(featureFlag);

		if(featureFlag.getVariations().size() > 0) {
			List<Variation> variations = featureFlag.getVariations();
			Variation activeVariation;

			activeVariation = variations.stream()
					.filter(t -> t.getDefaultVariation().contains(featureFlag.getStatus()))
					.findFirst()
					.orElse(new Variation());

			List<Variation> result = new ArrayList<>();
			result.add(activeVariation);

			resultFeatureFlag.setVariations(result);
		} 

		return resultFeatureFlag;
	}

	public void setAltUserIds(final List<String> altUserIds, final ResponseCallback<List<ExperimentUser>> callbacks) {

		UserAlias userAlias = new UserAlias(this.userId, altUserIds );

		AsyncInvoker invocation = this.apiService.prepareRequest(SET_ALT_USER_IDS);
		Entity<UserAlias> requestContent = Entity.json(userAlias);

		invocation.post(requestContent,new PublishingRetryCallback<>(invocation, requestContent, MAX_RETRIES, RequestType.POST,
				new InvocationCallback<Response>() {

			@Override
			public void completed(Response response) {
				if (response.getStatus() == Response.Status.OK.getStatusCode()) {
					callbacks.onSuccess(response.readEntity(new GenericType<List<ExperimentUser>>() {}));
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

	public void addGroupMetrics(final List<GroupMetric> metrics, final ResponseCallback<List<Metric>> callbacks) {
		
		MetricUnitBody<GroupMetric> metricUnit = new MetricUnitBody<>( metrics );
		Entity<MetricUnitBody<?>> requestContent = Entity.json(metricUnit);
		addMetrics(requestContent, callbacks);
	}

	public void addSingleMetrics(final List<SingleMetric> metrics, final ResponseCallback<List<Metric>> responseCallback) {
		
		MetricUnitBody<SingleMetric> metricUnit = new MetricUnitBody<>( metrics );
		Entity<MetricUnitBody<?>> requestContent = Entity.json(metricUnit);
		addMetrics(requestContent, responseCallback);
	}
	
	private void addMetrics(Entity<MetricUnitBody<?>> requestContent, final ResponseCallback<List<Metric>> callbacks) {
		
		AsyncInvoker invocation = this.apiService.prepareRequest(ADD_MATRIC);

		invocation.post(requestContent,new PublishingRetryCallback<>(invocation, requestContent, MAX_RETRIES, RequestType.POST,
				new InvocationCallback<Response>() {

			@Override
			public void completed(Response response) {
				if (response.getStatus() == Response.Status.OK.getStatusCode()) {
					callbacks.onSuccess(response.readEntity(new GenericType<List<Metric>>() {}));
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

	public void log(List<LogInput> value, final ResponseCallback<LogEventResponse> callbacks) {

		AsyncInvoker invocation = this.apiService.prepareRequest(LOG_EVENT);
		LogRequest logRequest = new LogRequest(this.userId, value );
		
		Entity<LogRequest> requestContent = Entity.json(logRequest);

		invocation.post(requestContent,new PublishingRetryCallback<>(invocation, requestContent, MAX_RETRIES, RequestType.POST,
				new InvocationCallback<Response>() {

			@Override
			public void completed(Response response) {
				if (response.getStatus() == Response.Status.OK.getStatusCode()) {
					LogEventResponse logEventResponse = null;
					try {
						logEventResponse = response.readEntity(LogEventResponse.class);
						
					} catch(Exception e) {
						callbacks.onError(new ErrorResponse(e.toString()));
					}
					callbacks.onSuccess(logEventResponse);
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
