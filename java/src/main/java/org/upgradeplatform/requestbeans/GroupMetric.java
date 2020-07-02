package org.upgradeplatform.requestbeans;

import java.util.List;


public class GroupMetric {
	
	private String  groupClass;
	private List<String> allowedKeys;
	private List<SingleMetric> attributes;
	
	public GroupMetric(String groupClass, List<String> allowedKeys, List<SingleMetric> attributes) {
		super();
		this.groupClass = groupClass;
		this.allowedKeys = allowedKeys;
		this.attributes = attributes;
	}

	public String getGroupClass() {
		return groupClass;
	}

	public void setGroupClass(String groupClass) {
		this.groupClass = groupClass;
	}

	public List<String> getAllowedKeys() {
		return allowedKeys;
	}

	public void setAllowedKeys(List<String> allowedKeys) {
		this.allowedKeys = allowedKeys;
	}

	public List<SingleMetric> getAttributes() {
		return attributes;
	}

	public void setAttributes(List<SingleMetric> attributes) {
		this.attributes = attributes;
	}
	
	
}
