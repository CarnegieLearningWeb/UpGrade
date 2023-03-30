package org.upgradeplatform.responsebeans;



public class ExperimentsResponse {
	
	private Object target;
	private String site;
	private String experimentType;
	private Condition assignedCondition;
	
	public ExperimentsResponse() {}
	
	

	public ExperimentsResponse(Object target, String site, String experimentType, Condition assignedCondition) {
		super();
		this.target = target;
		this.site = site;
		this.experimentType = experimentType;
		this.assignedCondition = assignedCondition;
	}

	public ExperimentsResponse(Object target, String site, String experimentType, Condition assignedCondition, String id) {
		super();
		this.target = target;
		this.site = site;
		this.experimentType = experimentType;
		this.assignedCondition = assignedCondition;
	}

	public Object getTarget() {
		return target;
	}

	public void setTarget(Object target) {
		this.target = target;
	}

	public String getSite() {
		return site;
	}

	public void setSite(String site) {
		this.site = site;
	}

	public String getExperimentType(){
		return experimentType;
	}

	public void setExperimentType(String experimentType){
		this.experimentType = experimentType;
	}

	public Condition getAssignedCondition() {
		return assignedCondition;
	}

	public void setAssignedCondition(Condition assignedCondition) {
		this.assignedCondition = assignedCondition;
	}

    @Override
    public String toString(){
        return "ExperimentsResponse [target=" + target + ", site=" + site 
               + ", assignedCondition=" + assignedCondition + "]";
    }
}
