package org.upgradeplatform.responsebeans;



public class ExperimentsResponse {
	
	private Object target;
	private String site;
	private Condition assignedCondition;
	
	public ExperimentsResponse() {}
	
	

	public ExperimentsResponse(Object target, String site, Condition assignedCondition) {
		super();
		this.target = target;
		this.site = site;
		this.assignedCondition = assignedCondition;
	}

	public ExperimentsResponse(Object target, String site, Condition assignedCondition, String id) {
		super();
		this.target = target;
		this.site = site;
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
