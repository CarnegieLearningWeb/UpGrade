package org.upgradeplatform.responsebeans;


public class FailedExperiment {
	
	private String createdAt;
	private String updatedAt;
	private Integer versionNumber;
	private Integer id;
	private Object endPoint;
	private Object errorCode;
	private String message;
	private Object name;
	private String type;
	
	
	public FailedExperiment() {}

	public FailedExperiment(String createdAt, String updatedAt, Integer versionNumber, Integer id, Object endPoint,
			Object errorCode, String message, Object name, String type) {
		super();
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
		this.versionNumber = versionNumber;
		this.id = id;
		this.endPoint = endPoint;
		this.errorCode = errorCode;
		this.message = message;
		this.name = name;
		this.type = type;
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

	public Integer getId() {
		return id;
	}

	public void setId(Integer id) {
		this.id = id;
	}

	public Object getEndPoint() {
		return endPoint;
	}

	public void setEndPoint(Object endPoint) {
		this.endPoint = endPoint;
	}

	public Object getErrorCode() {
		return errorCode;
	}

	public void setErrorCode(Object errorCode) {
		this.errorCode = errorCode;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}

	public Object getName() {
		return name;
	}

	public void setName(Object name) {
		this.name = name;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}
}
