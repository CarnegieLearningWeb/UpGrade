package org.upgradeplatform.requestbeans;

import org.upgradeplatform.utils.Utils.MarkedDecisionPointStatus;

public class MarkExperimentRequest {

	
	private String userId;
	private MarkedDecisionPointStatus status;
	private MarkExperimentRequestData data;
	private String clientError;
	private String uniquifier;

	public MarkExperimentRequest() {}

	public MarkExperimentRequest(String userId, MarkedDecisionPointStatus status, MarkExperimentRequestData data) {
		super();
		this.userId = userId;
		this.status = status;
		this.data = data;
	}

	public MarkExperimentRequest(String userId, MarkedDecisionPointStatus status, MarkExperimentRequestData data, String clientError) {
		super();
		this.userId = userId;
		this.status = status;
		this.data = data;
		this.clientError = clientError;
	}

	public MarkExperimentRequest(String userId, MarkedDecisionPointStatus status, MarkExperimentRequestData data,
			String clientError, String uniquifier) {
		this.userId = userId;
		this.status = status;
		this.data = data;
		this.clientError = clientError;
		this.uniquifier = uniquifier;
	}

	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}

	public MarkedDecisionPointStatus getStatus() {
		return status;
	}

	public void setStatus(MarkedDecisionPointStatus status){
		this.status = status;
	}

	public MarkExperimentRequestData getData(){
		return data;
	}
	
	public void setData(MarkExperimentRequestData data){
		this.data = data;
	}

	public String getClientError() {
		return this.clientError;
	}

	public void setClientError(String clientError) {
		this.clientError = clientError;
	}

	public String getUniquifier() {
		return uniquifier;
	}

	public void setUniquifier(String uniquifier) {
		this.uniquifier = uniquifier;
	}
	
}
