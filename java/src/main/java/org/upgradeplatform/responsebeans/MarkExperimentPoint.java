package org.upgradeplatform.responsebeans;

public class MarkExperimentPoint {
	

	private String createdAt;
	private String updatedAt;
	private Integer versionNumber;
	private String userId;
	private String experimentId;
	private String experimentPoint;
	private String id;
	
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

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public MarkExperimentPoint() {};
	
	public MarkExperimentPoint(String userId, String experimentId, String experimentPoint) {
		super();
		this.userId = userId;
		this.experimentId = experimentId;
		this.experimentPoint = experimentPoint;
	}


	public String getUserId() {
		return userId;
	}


	public void setUserId(String userId) {
		this.userId = userId;
	}


	public String getExperimentId() {
		return experimentId;
	}


	public void setExperimentId(String experimentId) {
		this.experimentId = experimentId;
	}


	public String getExperimentPoint() {
		return experimentPoint;
	}


	public void setExperimentPoint(String experimentPoint) {
		this.experimentPoint = experimentPoint;
	}


    
}
