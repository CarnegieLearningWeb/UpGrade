package org.upgradeplatform.responsebeans;

public class LogEventResponse {

	private String createdAt;
	private String updatedAt;
	private int versionNumber;
	private int id;
	private Object data;
	private Metric[] metrics;
	private InitRequest user;

	public LogEventResponse() {}

	public LogEventResponse(String createdAt, String updatedAt, int versionNumber, int id, Object data,
			Metric[] metrics, InitRequest user) {
		super();
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
		this.versionNumber = versionNumber;
		this.id = id;
		this.data = data;
		this.metrics = metrics;
		this.user = user;
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
	public int getId() {
		return id;
	}
	public void setId(int id) {
		this.id = id;
	}
	public Object getData() {
		return data;
	}
	public void setData(Object data) {
		this.data = data;
	}
	public Metric[] getMetrics() {
		return metrics;
	}
	public void setMetrics(Metric[] metrics) {
		this.metrics = metrics;
	}
	public InitRequest getUser() {
		return user;
	}
	public void setUser(InitRequest user) {
		this.user = user;
	}



}
