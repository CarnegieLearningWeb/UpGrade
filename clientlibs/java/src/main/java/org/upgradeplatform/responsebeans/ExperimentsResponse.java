package org.upgradeplatform.responsebeans;

import java.util.Map;

import org.upgradeplatform.utils.Utils.ExperimentType;

public class ExperimentsResponse {
	
	private Object target;
	private String site;
	private ExperimentType experimentType;
	private Condition assignedCondition;
	private Map<String, Factor> assignedFactor;
	
	public ExperimentsResponse() {
		super();
	}

	public ExperimentsResponse(Object target, String site, ExperimentType experimentType, Condition assignedCondition, Map<String,Factor> assignedFactor) {
		this.target = target;
		this.site = site;
		this.experimentType = experimentType;
		this.assignedCondition = assignedCondition;
		this.assignedFactor = assignedFactor;
	}

	public Map<String,Factor> getAssignedFactor() {
		return this.assignedFactor;
	}

	public void setAssignedFactor(Map<String,Factor> assignedFactor) {
		this.assignedFactor = assignedFactor;
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

	public ExperimentType getExperimentType(){
		return experimentType;
	}

	public void setExperimentType(ExperimentType experimentType){
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
               + ", assignedCondition=" + assignedCondition + ", assignedFactor=" + assignedFactor + "]";
    }

	public String getFactorLevel(String factor) {
		if (this.experimentType == ExperimentType.Factorial){
			return this.assignedFactor.containsKey(factor) ? this.assignedFactor.get(factor).getLevel() : null;
		}
		else {
			return null;
		}
	}

	public Payload getFactorPayload(String factor){
		if (this.experimentType == ExperimentType.Factorial){
			return this.assignedFactor.containsKey(factor) ? this.assignedFactor.get(factor).getPayload() : null;
		}
		else {
			return null;
		}
	}
}
