package org.upgradeplatform.responsebeans;

import org.upgradeplatform.utils.Utils.MarkedDecisionPointStatus;

public class MarkExperimentPoint {
	

	private String userId;
	private String experimentId;
	private String enrollmentCode;
	private String condition;
	private String site;
	private String target;
	private String id;
	private MarkedDecisionPointStatus status;

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
	
	public MarkExperimentPoint(String userId, String experimentId, String site, String target) {
		super();
		this.userId = userId;
		this.experimentId = experimentId;
		this.site = site;
		this.target = target;
	}

	public MarkExperimentPoint(String userId, MarkedDecisionPointStatus status, String site, String target) {
		super();
		this.userId = userId;
		this.status = status;
		this.site = site;
		this.target = target;
	}

	public MarkExperimentPoint(String userId, String site, String target, String condition, String experimentId, String id) {
		super();
		this.userId = userId;
		this.site = site;
		this.target = target;
		this.condition = condition;
		this.experimentId = experimentId;
		this.id = id;
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

	public String getSite() {
		return site;
	}

	public void setSite(String site) {
		this.site = site;
	}

	public String getTarget() {
		return target;
	}

	public void setTarget(String target) {
		this.target = target;
	}

    @Override
    public String toString(){
        return "MarkExperimentPoint [userId=" + userId + ", experimentId=" + experimentId + ", enrollmentCode=" 
			   + enrollmentCode + ", condition=" + condition + ", site="
			   + site + ", target=" + target + ", status=" + status + ", id=" + id + "]";
    }

	
}
