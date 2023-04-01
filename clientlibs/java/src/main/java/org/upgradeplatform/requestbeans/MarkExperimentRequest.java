package org.upgradeplatform.requestbeans;

public class MarkExperimentRequest {

	
	private String userId;
	private String status;
	private MarkExperimentRequestData data;
	
	public MarkExperimentRequest() {}

	public MarkExperimentRequest(String userId, MarkExperimentRequestData data) {
		super();
		this.userId = userId;
		this.data = data;
	}

	public MarkExperimentRequest(String userId, MarkExperimentRequestData data, String status) {
		super();
		this.userId = userId;
		this.data = data;
		this.status = status;
	}

	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status){
		this.status = status;
	}

	public MarkExperimentRequestData getData(){
		return data;
	}
	
	public void setData(MarkExperimentRequestData data){
		this.data = data;
	}
}
