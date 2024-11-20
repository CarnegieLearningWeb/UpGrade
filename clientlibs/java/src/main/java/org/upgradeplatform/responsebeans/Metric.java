package org.upgradeplatform.responsebeans;

import org.upgradeplatform.utils.Utils.MetricMetaData;

public class Metric {

	private String key;
	private MetricMetaData type;
	private String[] allowedData;
	private String createdAt;
	private String updatedAt;
	private Integer versionNumber;
	private String[] context;

	public Metric() {
	}

	public Metric(String key, MetricMetaData type, String[] allowedData, String createdAt, String updatedAt,
			Integer versionNumber, String[] context) {
		super();
		this.key = key;
		this.type = type;
		this.allowedData = allowedData;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
		this.versionNumber = versionNumber;
		this.context = context;
	}

	public String getKey() {
		return key;
	}

	public void setKey(String key) {
		this.key = key;
	}

	public MetricMetaData getType() {
		return type;
	}

	public void setType(MetricMetaData type) {
		this.type = type;
	}

	public String[] getAllowedData() {
		return allowedData;
	}

	public void setAllowedData(String[] allowedData) {
		this.allowedData = allowedData;
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

	public Integer getVersionNumber() {
		return versionNumber;
	}

	public void setVersionNumber(Integer versionNumber) {
		this.versionNumber = versionNumber;
	}

	public String[] getContext() {
		return context;
	}

	public void setContext(String[] context) {
		this.context = context;
	}

}
