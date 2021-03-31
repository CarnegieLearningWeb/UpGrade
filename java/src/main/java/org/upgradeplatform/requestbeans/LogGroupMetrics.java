package org.upgradeplatform.requestbeans;

import java.util.*;

public class LogGroupMetrics {
	private String groupClass;
	private String groupKey;
	private String groupUniquifier;
	private HashMap<String, Object> attributes;
	
	public LogGroupMetrics(String groupClass, String groupKey, String groupUniquifier, HashMap<String, Object> attributes) {
		super();
		this.groupClass = groupClass;
		this.groupKey = groupKey;
		this.groupUniquifier = groupUniquifier;
		this.attributes = attributes;
	}
	
	public String getGroupClass() {
		return groupClass;
	}
	public void setGroupClass(String groupClass) {
		this.groupClass = groupClass;
	}
	public String getGroupKey() {
		return groupKey;
	}
	public void setGroupKey(String groupKey) {
		this.groupKey = groupKey;
	}
	public String getGroupUniquifier() {
		return groupUniquifier;
	}
	public void setGroupUniquifier(String groupUniquifier) {
		this.groupUniquifier = groupUniquifier;
	}
	public HashMap<String, Object> getAttributes() {
		return attributes;
	}
	public void setAttributes(HashMap<String, Object> attributes) {
		this.attributes = attributes;
	}
	
	
}
