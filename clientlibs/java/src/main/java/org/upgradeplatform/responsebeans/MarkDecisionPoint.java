package org.upgradeplatform.responsebeans;

public class MarkDecisionPoint {
	

	private String userId;
	private String experimentId;
	private String condition;
	private String site;
	private String target;
	private String id;

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public MarkDecisionPoint() {}
	
	public MarkDecisionPoint(String userId, String experimentId, String site, String target) {
		super();
		this.userId = userId;
		this.experimentId = experimentId;
		this.site = site;
		this.target = target;
	}

	public MarkDecisionPoint(String userId, String site, String target) {
		super();
		this.userId = userId;
		this.site = site;
		this.target = target;
	}

	public MarkDecisionPoint(String userId, String site, String target, String condition, String experimentId, String id) {
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
        return "MarkExperimentPoint [userId=" + userId + ", experimentId=" + experimentId + 
		 ", condition=" + condition + ", site=" + site + ", target=" + target + ", id=" + id + "]";
    }

	
}
