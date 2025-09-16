package org.upgradeplatform.responsebeans;

import java.util.Arrays;

public class LogEventResponse {

	private String id;
	private Object data;
	private Metric[] metrics;
	private ExperimentUserResponse user;
	private String timeStamp;
	private String uniquifier;

	public LogEventResponse() {
	}

	public LogEventResponse(String id, Object data,
			Metric[] metrics, ExperimentUserResponse user, String timeStamp, String uniquifier) {
		super();
		this.id = id;
		this.data = data;
		this.metrics = metrics;
		this.user = user;
		this.timeStamp = timeStamp;
		this.uniquifier = uniquifier;
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

	public Metric[] getMetrics() {
		return metrics;
	}

	public void setMetrics(Metric[] metrics) {
		this.metrics = metrics;
	}

	public ExperimentUserResponse getUser() {
		return user;
	}

	public void setUser(ExperimentUserResponse user) {
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

	@Override
	public String toString() {
		return "LogEventResponse [id=" + id + ", data=" + data + ", metrics=" + Arrays.toString(metrics)
			   + ", user=" + user + ", timeStamp=" + timeStamp + ", uniquifier=" + uniquifier + "]";
	}

}
