package org.upgradeplatform.client;

import static org.upgradeplatform.utils.Utils.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.UnaryOperator;

import javax.ws.rs.ProcessingException;
import javax.ws.rs.client.AsyncInvoker;
import javax.ws.rs.client.Entity;
import javax.ws.rs.client.InvocationCallback;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;

import org.eclipse.jdt.annotation.NonNull;
import org.upgradeplatform.interfaces.ResponseCallback;
import org.upgradeplatform.requestbeans.ExperimentRequest;
import org.upgradeplatform.requestbeans.GroupMetric;
import org.upgradeplatform.requestbeans.LogInput;
import org.upgradeplatform.requestbeans.LogRequest;
import org.upgradeplatform.requestbeans.MarkExperimentRequest;
import org.upgradeplatform.requestbeans.MarkExperimentRequestData;
import org.upgradeplatform.requestbeans.MetricUnitBody;
import org.upgradeplatform.requestbeans.SingleMetric;
import org.upgradeplatform.requestbeans.UserAlias;
import org.upgradeplatform.responsebeans.UserAliasResponse;
import org.upgradeplatform.responsebeans.Assignment;
import org.upgradeplatform.responsebeans.Condition;
import org.upgradeplatform.responsebeans.ErrorResponse;
import org.upgradeplatform.responsebeans.ExperimentUser;
import org.upgradeplatform.responsebeans.ExperimentsResponse;
import org.upgradeplatform.responsebeans.Factor;
import org.upgradeplatform.responsebeans.FeatureFlag;
import org.upgradeplatform.responsebeans.InitializeUser;
import org.upgradeplatform.responsebeans.LogEventResponse;
import org.upgradeplatform.responsebeans.MarkDecisionPoint;
import org.upgradeplatform.responsebeans.Metric;
import org.upgradeplatform.responsebeans.Variation;
import org.upgradeplatform.utils.APIService;
import org.upgradeplatform.utils.PublishingRetryCallback;
import org.upgradeplatform.utils.Utils.MarkedDecisionPointStatus;
import org.upgradeplatform.utils.Utils.RequestType;

public class ExperimentClient implements AutoCloseable {

	private List<ExperimentsResponse> allExperiments;
	private List<FeatureFlag> allFeatureFlag;
	private final String userId;
	private final APIService apiService;

	/** @param properties
     *            Properties to permit users to control how the underlying JAX-RS
     *            client behaves. These are passed through to
     *            {@link javax.ws.rs.core.Configurable#property(String, Object)}. */
	public ExperimentClient(String userId, String authToken, String baseUrl, Map<String, Object> properties) {
		this(userId, authToken, UUID.randomUUID().toString(), baseUrl, properties);
	}

    /** @param properties
     *            Properties to permit users to control how the underlying JAX-RS
     *            client behaves. These are passed through to
     *            {@link javax.ws.rs.core.Configurable#property(String, Object)}. */
	public ExperimentClient(String userId, String authToken, String sessionId, String baseUrl, Map<String, Object> properties) {
		if (isStringNull(userId)) {
			throw new IllegalArgumentException(INVALID_STUDENT_ID);
		}
		this.userId = userId;
		this.apiService = new APIService(baseUrl, authToken, sessionId, properties);
	}

	// To close jax-rs client connection open when calling ExperimentClient constructor;
	@Override
	public void close() {
		this.apiService.close();
	}

	// Initialize user with userId
	public void init(final ResponseCallback<InitializeUser> callbacks) {
		InitializeUser initUser = new InitializeUser(this.userId, null, null);
		initializeUser(initUser, callbacks);
	}

	// Initialize user with userId and group
	public void init(Map<String, List<String>> group, final ResponseCallback<InitializeUser> callbacks) {
		InitializeUser experimentUser = new InitializeUser(this.userId, group, null);
		initializeUser(experimentUser, callbacks);
	}

	// Initialize user with userId, group and workingGroup
	public void init(Map<String, List<String>> group, Map<String, String> workingGroup,
					 final ResponseCallback<InitializeUser> callbacks) {
		InitializeUser experimentUser = new InitializeUser(this.userId, group, workingGroup);
		initializeUser(experimentUser, callbacks);
	}

	private void initializeUser(InitializeUser initUser, final ResponseCallback<InitializeUser> callbacks) {
		// Build a request object and prepare invocation method
		AsyncInvoker invocation = this.apiService.prepareRequest(INITIALIZE_USER);
		Entity<InitializeUser> requestContent = Entity.json(initUser);

		// Invoke the method
		invocation.post(requestContent,new PublishingRetryCallback<>(invocation, requestContent, MAX_RETRIES, RequestType.POST,
			new InvocationCallback<Response>() {

				@Override
				public void completed(Response response) {
					if (response.getStatus() == Response.Status.OK.getStatusCode()) {
					    readResponseToCallback(response, callbacks, InitializeUser.class);
					} else {
						String status = Response.Status.fromStatusCode(response.getStatus()).toString();
						ErrorResponse error = new ErrorResponse(response.getStatus(), response.readEntity(String.class), status);
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

	public void setGroupMembership(Map<String, List<String>> group, final ResponseCallback<ExperimentUser> callbacks) {
		// Build a request object and prepare invocation method
		ExperimentUser experimentUser = new ExperimentUser(this.userId, group, null);
		AsyncInvoker invocation = this.apiService.prepareRequest(SET_GROUP_MEMBERSHIP);
		Entity<ExperimentUser> requestContent = Entity.json(experimentUser);

		// Invoke the method
		invocation.method(PATCH, requestContent,new PublishingRetryCallback<>(invocation, requestContent, MAX_RETRIES, RequestType.PATCH, 
				new InvocationCallback<Response>() {

			@Override
			public void completed(Response response) {
				if (response.getStatus() == Response.Status.OK.getStatusCode()) {
				    readResponseToCallback(response, callbacks, ExperimentUser.class);
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

		invocation.method(PATCH, requestContent,new PublishingRetryCallback<>(invocation, requestContent, MAX_RETRIES, RequestType.PATCH,
				new InvocationCallback<Response>() {

			@Override
			public void completed(Response response) {
				if (response.getStatus() == Response.Status.OK.getStatusCode()) {
				    readResponseToCallback(response, callbacks, ExperimentUser.class);
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

	public void getAllExperimentConditions(String context, final ResponseCallback<List<ExperimentsResponse>> callbacks) {
		ExperimentRequest experimentRequest = new ExperimentRequest(this.userId, context);
		AsyncInvoker invocation = this.apiService.prepareRequest(GET_ALL_EXPERIMENTS);
		Entity<ExperimentRequest> requestContent = Entity.json(experimentRequest);

		invocation.post(requestContent,new PublishingRetryCallback<>(invocation, requestContent, MAX_RETRIES, RequestType.POST,
				new InvocationCallback<Response>() {

			@Override
			public void completed(Response response) {
				if (response.getStatus() == Response.Status.OK.getStatusCode()) {
					// Cache allExperiment data for future requests
				    readResponseToCallback(response, callbacks, new GenericType<List<ExperimentsResponse>>() {})
				        .ifPresent(ae -> allExperiments = ae);
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


    /**@param site This is matched case-insensitively*/
	public void getExperimentCondition(String context, String site, final ResponseCallback<Assignment> callbacks) {
		getExperimentCondition(context, site, null, callbacks);
	}

	/**@param site This is matched case-insensitively
     * @param target This is matched case-insensitively*/
	public void getExperimentCondition(String context, String site, String target,
			final ResponseCallback<Assignment> callbacks) {

				if (this.allExperiments != null) {
					ExperimentsResponse resultExperimentsResponse = findExperimentResponse(site, target, allExperiments);
					Map<String, Factor> assignedFactor = resultExperimentsResponse.getAssignedFactor() != null ? resultExperimentsResponse.getAssignedFactor()[0] : null;
					Condition assignedCondition = resultExperimentsResponse.getAssignedCondition() != null ? resultExperimentsResponse.getAssignedCondition()[0] : null;
					Assignment resultAssignment = new Assignment(this, target, site, resultExperimentsResponse.getExperimentType(), assignedCondition, assignedFactor);

					if (callbacks != null) {
						callbacks.onSuccess(resultAssignment);
					}
				} else {
					getAllExperimentConditions(context, new ResponseCallback<List<ExperimentsResponse>>() {
						@Override
						public void onSuccess(@NonNull List<ExperimentsResponse> experiments) {

							ExperimentsResponse resultExperimentsResponse = findExperimentResponse(site, target, experiments);
							Map<String, Factor> assignedFactor = resultExperimentsResponse.getAssignedFactor() != null ? resultExperimentsResponse.getAssignedFactor()[0] : null;
							Condition assignedCondition = resultExperimentsResponse.getAssignedCondition() != null ? resultExperimentsResponse.getAssignedCondition()[0] : null;
							Assignment resultAssignment = new Assignment(ExperimentClient.this, target, site, resultExperimentsResponse.getExperimentType(), assignedCondition, assignedFactor);
							
							if (callbacks != null) {
								callbacks.onSuccess(resultAssignment);
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

    /**@param site This is matched case-insensitively*/
	public void getAllExperimentConditions(String context, String site, final ResponseCallback<ExperimentsResponse> callbacks) {
		getAllExperimentConditions(context, site, null, callbacks);
	}

    /**@param site This is matched case-insensitively
     * @param target This is matched case-insensitively*/
	public void getAllExperimentConditions(String context, String site, String target,
			final ResponseCallback<ExperimentsResponse> callbacks) {
		if (this.allExperiments != null) {

			ExperimentsResponse resultCondition = findExperimentResponse(site, target, allExperiments);

			if (callbacks != null) {
				callbacks.onSuccess(resultCondition);
			}
		} else {
			getAllExperimentConditions(context, new ResponseCallback<List<ExperimentsResponse>>() {
				@Override
				public void onSuccess(@NonNull List<ExperimentsResponse> experiments) {

					ExperimentsResponse resultCondition = findExperimentResponse(site, target, experiments);

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

	private ExperimentsResponse findExperimentResponse(String site, String target,
			List<ExperimentsResponse> experiments) {
		return experiments.stream()
				.filter(t -> t.getSite().equalsIgnoreCase(site) &&
						(isStringNull(target) ? isStringNull(t.getTarget().toString())
								: t.getTarget().toString().equalsIgnoreCase(target)))
				.findFirst()
				.map(ExperimentClient::copyExperimentResponse)
				.orElse(new ExperimentsResponse());
	}

	private void rotateConditions(String site, String target) {
		if (this.allExperiments != null) {
			ExperimentsResponse result = this.allExperiments.stream().filter(t -> t.getSite().equalsIgnoreCase(site) &&
					(isStringNull(target) ? isStringNull(t.getTarget().toString())
					: t.getTarget().toString().equalsIgnoreCase(target))).findFirst().orElse(null);
			if (result != null) {
				Condition[] rotatedCondition = Arrays.copyOf(result.getAssignedCondition(),
						result.getAssignedCondition().length);
				List<Condition> rotatedList = Arrays.asList(rotatedCondition);
				Collections.rotate(rotatedList, -1);
				rotatedCondition = rotatedList.toArray(rotatedCondition);
				result.setAssignedCondition(rotatedCondition);
				result.setAssignedFactor(result.getAssignedFactor());
			}
		}
	}

	private static ExperimentsResponse copyExperimentResponse(ExperimentsResponse experimentsResponse) {
		ExperimentsResponse resultCondition = new ExperimentsResponse(experimentsResponse.getTarget().toString(),
				experimentsResponse.getSite(), experimentsResponse.getExperimentType(), Arrays.copyOf(experimentsResponse.getAssignedCondition(),
				experimentsResponse.getAssignedCondition().length), experimentsResponse.getAssignedFactor());
		return resultCondition;
	}

	public void markDecisionPoint(final String site, String condition, MarkedDecisionPointStatus status,
			final ResponseCallback<MarkDecisionPoint> callbacks) {
		MarkExperimentRequestData markExperimentRequestData = new MarkExperimentRequestData(site, "", new Condition(condition));
		markDecisionPoint(status, markExperimentRequestData, "", "", callbacks);
	}

	public void markDecisionPoint(final String site, String target, String condition, MarkedDecisionPointStatus status,
			final ResponseCallback<MarkDecisionPoint> callbacks) {
		MarkExperimentRequestData markExperimentRequestData = new MarkExperimentRequestData(site, target, new Condition(condition));
		markDecisionPoint(status, markExperimentRequestData, "", "", callbacks);
	}

	public void markDecisionPoint(final String site, String condition, MarkedDecisionPointStatus status, String clientError,
			final ResponseCallback<MarkDecisionPoint> callbacks) {
		MarkExperimentRequestData markExperimentRequestData = new MarkExperimentRequestData(site, "", new Condition(condition));
		markDecisionPoint(status, markExperimentRequestData, clientError, "", callbacks);
	}

	public void markDecisionPoint(final String site, String target, String condition, MarkedDecisionPointStatus status, String clientError,
			final ResponseCallback<MarkDecisionPoint> callbacks) {
		MarkExperimentRequestData markExperimentRequestData = new MarkExperimentRequestData(site, target, new Condition(condition));
		markDecisionPoint(status, markExperimentRequestData, clientError, "", callbacks);
	}

	public void markDecisionPoint(final String site, String condition, MarkedDecisionPointStatus status, String clientError, String uniquifier,
			final ResponseCallback<MarkDecisionPoint> callbacks) {
		MarkExperimentRequestData markExperimentRequestData = new MarkExperimentRequestData(site, "", new Condition(condition));
		markDecisionPoint(status, markExperimentRequestData, clientError, uniquifier, callbacks);
	}

	public void markDecisionPoint(final String site, String target, String condition, MarkedDecisionPointStatus status, String clientError, String uniquifier,
			final ResponseCallback<MarkDecisionPoint> callbacks) {
		MarkExperimentRequestData markExperimentRequestData = new MarkExperimentRequestData(site, target, new Condition(condition));
		markDecisionPoint(status, markExperimentRequestData, clientError, uniquifier, callbacks);
	}

	public void markDecisionPoint(MarkedDecisionPointStatus status, MarkExperimentRequestData data,
			final ResponseCallback<MarkDecisionPoint> callbacks) {
		markDecisionPoint(status, data, "", "", callbacks);
	}

	public void markDecisionPoint(MarkedDecisionPointStatus status, MarkExperimentRequestData data, String clientError, String uniquifier,
			final ResponseCallback<MarkDecisionPoint> callbacks) {
		MarkExperimentRequest markExperimentRequest = new MarkExperimentRequest(this.userId, status, data, clientError, uniquifier);
		AsyncInvoker invocation = this.apiService.prepareRequest(MARK_EXPERIMENT_POINT);

		Entity<MarkExperimentRequest> requestContent = Entity.json(markExperimentRequest);

		// Invoke the method
		invocation.post(requestContent,new PublishingRetryCallback<>(invocation, requestContent, MAX_RETRIES, RequestType.POST,
				new InvocationCallback<Response>() {

			@Override
			public void completed(Response response) {
				if (response.getStatus() == Response.Status.OK.getStatusCode()) {

				    readResponseToCallback(response, callbacks, MarkDecisionPoint.class);
					rotateConditions(data.getSite(), data.getTarget());
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
				    readResponseToCallback(response, callbacks, new GenericType<List<FeatureFlag>>() {})
				        .ifPresent(aff -> allFeatureFlag = aff);

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

	public void setAltUserIds(final List<String> altUserIds, final ResponseCallback<UserAliasResponse> callbacks) {

		UserAlias userAlias = new UserAlias(this.userId, altUserIds );

		AsyncInvoker invocation = this.apiService.prepareRequest(SET_ALT_USER_IDS);
		Entity<UserAlias> requestContent = Entity.json(userAlias);

		invocation.method(PATCH, requestContent,new PublishingRetryCallback<>(invocation, requestContent, MAX_RETRIES, RequestType.PATCH,
				new InvocationCallback<Response>() {

			@Override
			public void completed(Response response) {
				if (response.getStatus() == Response.Status.OK.getStatusCode()) {
				    readResponseToCallback(response, callbacks, new GenericType<UserAliasResponse>() {});
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
				    readResponseToCallback(response, callbacks, new GenericType<List<Metric>>() {});
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
					try {
					    readResponseToCallback(response, callbacks, LogEventResponse.class);
					} catch(Exception e) {
						callbacks.onError(new ErrorResponse(e.toString()));
					}
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

    /**helper method to include more useful information in the ErrorResponse for a ProcessingException*/
    private static <T> Optional<T> readResponseToCallback(Response response, ResponseCallback<T> callback, GenericType<T> typeToken) {
        response.bufferEntity();
        try {
            T entity = response.readEntity(typeToken);
            callback.onSuccess(entity);
            return Optional.of(entity);
        } catch (ProcessingException pe) {
            callback.onError(new ErrorResponse(pe.getMessage() + "; cause: " + pe.getCause() + "; body: " + response.readEntity(String.class)));
            return Optional.empty();
        }
    }

    /**helper method to include more useful information in the ErrorResponse for a ProcessingException*/
    private static <T> void readResponseToCallback(Response response, ResponseCallback<T> callback, Class<T> clazz) {
        readResponseToCallback(response, callback, clazz, UnaryOperator.identity());
    }

    /**helper method to include more useful information in the ErrorResponse for a ProcessingException*/
    private static <T> void readResponseToCallback(Response response, ResponseCallback<T> callback, Class<T> clazz, UnaryOperator<T> finisher) {
	    response.bufferEntity();
	    try {
	        callback.onSuccess(finisher.apply(response.readEntity(clazz)));
	    } catch (ProcessingException pe) {
	        callback.onError(new ErrorResponse(pe.getMessage() + "; cause: " + pe.getCause() + "; body: " + response.readEntity(String.class)));
	    }
	}
}
