package org.upgradeplatform.responsebeans;



public class ExperimentsResponse {
	
	private Object expId;
	private String expPoint;
	private String twoCharacterId;
	private AssignedCondition assignedCondition;
	
	public ExperimentsResponse() {}
	
	

	public ExperimentsResponse(Object expId, String expPoint, String twoCharacterId,
			AssignedCondition assignedCondition) {
		super();
		this.expId = expId;
		this.expPoint = expPoint;
		this.twoCharacterId = twoCharacterId;
		this.assignedCondition = assignedCondition;
	}



	public Object getExpId() {
		return expId;
	}

	public void setExpId(Object expId) {
		this.expId = expId;
	}

	public String getExpPoint() {
		return expPoint;
	}

	public void setExpPoint(String expPoint) {
		this.expPoint = expPoint;
	}

	public String getTwoCharacterId() {
		return twoCharacterId;
	}

	public void setTwoCharacterId(String twoCharacterId) {
		this.twoCharacterId = twoCharacterId;
	}

	public AssignedCondition getAssignedCondition() {
		return assignedCondition;
	}

	public void setAssignedCondition(AssignedCondition assignedCondition) {
		this.assignedCondition = assignedCondition;
	}

    @Override
    public String toString(){
        return "ExperimentsResponse [expId=" + expId + ", expPoint=" + expPoint + ", twoCharacterId=" + twoCharacterId
               + ", assignedCondition=" + assignedCondition + "]";
    }
}
