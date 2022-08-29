package org.upgradeplatform.responsebeans;

import org.upgradeplatform.utils.Utils.MarkedDecisionPointStatus;

public class MarkExperimentPoint {
	

	private String createdAt;
	private String updatedAt;
	private Integer versionNumber;
	private String userId;
	private String experimentId;
	private String experimentPoint;
	private String enrollmentCode;
	private String condition;
	private String id;
	private MarkedDecisionPointStatus status;
	private String decisionPoint;
	
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

	public MarkedDecisionPointStatus getStatus() {
		return status;
	}

	public void setStatus(MarkedDecisionPointStatus status){
		this.status = status;
	}

	public MarkExperimentPoint() {}
	
	public MarkExperimentPoint(String userId, String experimentId, String experimentPoint) {
		super();
		this.userId = userId;
		this.experimentId = experimentId;
		this.experimentPoint = experimentPoint;
	}

	public MarkExperimentPoint(String userId, String experimentId, String experimentPoint, MarkedDecisionPointStatus status) {
		super();
		this.userId = userId;
		this.experimentId = experimentId;
		this.experimentPoint = experimentPoint;
		this.status = status;
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

	public String getEnrollmentCode() {
	    return enrollmentCode;
	}

	public void setEnrollmentCode(String enrollmentCode) {
	    this.enrollmentCode = enrollmentCode;
	}

	public String getCondition() {
	    return condition;
	}

	public void setCondition(String condition) {
	    this.condition = condition;
	}

	public String getDecisionPoint() {
		return decisionPoint;
	}

	public void setDecisionPoint(String decisionPoint) {
		this.decisionPoint = decisionPoint;
	}

    @Override
    public String toString(){
        return "MarkExperimentPoint [createdAt=" + createdAt + ", updatedAt=" + updatedAt + ", versionNumber="
               + versionNumber + ", userId=" + userId + ", experimentId=" + experimentId + ", experimentPoint="
               + experimentPoint + ", enrollmentCode=" + enrollmentCode + ", condition=" + condition + ", decisionPoint="
			    + decisionPoint + ", status=" + status + ", id=" + id + "]";
    }

	
}
