package org.upgradeplatform.requestbeans;

import org.upgradeplatform.utils.Utils.MarkedDecisionPointStatus;

public class MarkExperimentRequest {

	private String status;
	private MarkExperimentRequestData data;
	private String clientError;
	private String uniquifier;
	private String context;

	public MarkExperimentRequest() {}

	public MarkExperimentRequest(MarkedDecisionPointStatus status, MarkExperimentRequestData data, String context) {
		super();
		this.status = status.toString();
		this.data = data;
		this.context = context;
	}

	public MarkExperimentRequest(MarkedDecisionPointStatus status, MarkExperimentRequestData data, String clientError,
			String context) {
		super();
		this.status = status.toString();
		this.data = data;
		this.clientError = clientError;
		this.context = context;
	}

	public MarkExperimentRequest(MarkedDecisionPointStatus status, MarkExperimentRequestData data,
			String clientError, String uniquifier, String context) {
		this.status = status.toString();
		this.data = data;
		this.clientError = clientError;
		this.uniquifier = uniquifier;
		this.context = context;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(MarkedDecisionPointStatus status){
		this.status = status.toString();
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

	public String getContext() {
		return context;
	}

	public void setContext(String context) {
		this.context = context;
	}
}
