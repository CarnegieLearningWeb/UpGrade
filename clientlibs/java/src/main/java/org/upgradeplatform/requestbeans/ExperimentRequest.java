package org.upgradeplatform.requestbeans;
public class ExperimentRequest {

	private String context;
	
	public ExperimentRequest(String context) {
		super();
		this.context = context;
	}

	public String getContext() {
		return context;
	}

	public void setContext(String context) {
		this.context = context;
	}
}
