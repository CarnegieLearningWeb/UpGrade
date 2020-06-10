package org.upgradeplatform.responsebeans;


public class Metric {


	private Object key;
	private String type;
	private String[] allowedData;
	private String createdAt;
	private String updatedAt;
	private Integer versionNumber;

	public Metric() {}

	public Metric(Object key, String type, String[] allowedData, String createdAt, String updatedAt, Integer versionNumber) {
		super();
		this.key = key;
		this.type = type;
		this.allowedData = allowedData;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
		this.versionNumber = versionNumber;
	}

	public Object getKey() {
		return key;
	}

	public void setKey(Object key) {
		this.key = key;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
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


}
