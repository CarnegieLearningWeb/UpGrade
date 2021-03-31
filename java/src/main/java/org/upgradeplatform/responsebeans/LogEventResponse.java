package org.upgradeplatform.responsebeans;

public class LogEventResponse {

	private String createdAt;
	private String updatedAt;
	private int versionNumber;
	private String id;
	private Object data;
	private Metric metrics;
	private ExperimentUser user;
	private String timeStamp;
	private String uniquifier;
	
	public LogEventResponse(String createdAt, String updatedAt, int versionNumber, String id, Object data,
			Metric metrics, ExperimentUser user, String timeStamp, String uniquifier) {
		super();
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
		this.versionNumber = versionNumber;
		this.id = id;
		this.data = data;
		this.metrics = metrics;
		this.user = user;
		this.timeStamp = timeStamp;
		this.uniquifier = uniquifier;
	}
	
	public String getCreatedAt() {
		return createdAt;
	}
	public void setCreatedAt(String createdAt) {
		this.createdAt = createdAt;
	}
	public String getUpdatedAt() {
		return updatedAt;
	}
	public void setUpdatedAt(String updatedAt) {
		this.updatedAt = updatedAt;
	}
	public int getVersionNumber() {
		return versionNumber;
	}
	public void setVersionNumber(int versionNumber) {
		this.versionNumber = versionNumber;
	}
	public String getId() {
		return id;
	}
	public void setId(String id) {
		this.id = id;
	}
	public Object getData() {
		return data;
	}
	public void setData(Object data) {
		this.data = data;
	}
	public Metric getMetrics() {
		return metrics;
	}
	public void setMetrics(Metric metrics) {
		this.metrics = metrics;
	}
	public ExperimentUser getUser() {
		return user;
	}
	public void setUser(ExperimentUser user) {
		this.user = user;
	}
	public String getTimeStamp() {
		return timeStamp;
	}
	public void setTimeStamp(String timeStamp) {
		this.timeStamp = timeStamp;
	}
	public String getUniquifier() {
		return uniquifier;
	}
	public void setUniquifier(String uniquifier) {
		this.uniquifier = uniquifier;
	}
	
	

	
}
