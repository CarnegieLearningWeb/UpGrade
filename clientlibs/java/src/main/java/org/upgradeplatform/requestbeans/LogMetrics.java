package org.upgradeplatform.requestbeans;

import java.util.HashMap;
import java.util.List;

public class LogMetrics {
	private HashMap<String, Object> attributes;
	private List<LogGroupMetrics> groupedMetrics;
	
	public LogMetrics(HashMap<String, Object> attributes, List<LogGroupMetrics> groupedMetrics) {
		super();
		this.attributes = attributes;
		this.groupedMetrics = groupedMetrics;
	}
	
	public HashMap<String, Object> getAttributes() {
		return attributes;
	}
	public void setAttributes(HashMap<String, Object> attributes) {
		this.attributes = attributes;
	}
	public List<LogGroupMetrics> getGroupedMetrics() {
		return groupedMetrics;
	}
	public void setGroupedMetrics(List<LogGroupMetrics> groupedMetrics) {
		this.groupedMetrics = groupedMetrics;
	}
	
	
}
