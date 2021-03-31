package org.upgradeplatform.requestbeans;

public class LogInput {
	private String timestamp;
	private LogMetrics metrics;
	
	public LogInput(String timestamp, LogMetrics metrics) {
		super();
		this.timestamp = timestamp;
		this.metrics = metrics;
	}
	
	public String getTimestamp() {
		return timestamp;
	}
	public void setTimestamp(String timestamp) {
		this.timestamp = timestamp;
	}
	public LogMetrics getMetrics() {
		return metrics;
	}
	public void setMetrics(LogMetrics metrics) {
		this.metrics = metrics;
	}
	
}
