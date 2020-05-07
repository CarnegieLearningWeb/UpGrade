package org.upgradeplatform.requestbeans;

public class FailedExperimentPointRequest {

	private String userId;
	private String experimentPoint;
	private String experimentId;
	private String reason;
	
	public FailedExperimentPointRequest() {}
	
	public FailedExperimentPointRequest(String userId, String experimentPoint, String experimentId, String reason) {
		super();
		this.userId = userId;
		this.experimentPoint = experimentPoint;
		this.experimentId = experimentId;
		this.reason = reason;
	}
	
	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}

	public String getExperimentPoint() {
		return experimentPoint;
	}
	public void setExperimentPoint(String experimentPoint) {
		this.experimentPoint = experimentPoint;
	}
	public String getExperimentId() {
		return experimentId;
	}
	public void setExperimentId(String experimentId) {
		this.experimentId = experimentId;
	}
	public String getReason() {
		return reason;
	}
	public void setReason(String reason) {
		this.reason = reason;
	}
	
	
	
	
}
