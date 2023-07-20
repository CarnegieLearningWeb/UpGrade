package org.upgradeplatform.responsebeans;

import java.util.Map;

import org.upgradeplatform.utils.Utils.ExperimentType;

public class ExperimentsResponse {
	
	private String target;
	private String site;
	private ExperimentType experimentType;
	private Condition[] assignedCondition;
	private Map<String, Factor>[] assignedFactor;
	
	public ExperimentsResponse() {
		super();
	}

	public ExperimentsResponse(String target, String site, ExperimentType experimentType, Condition[] assignedCondition, Map<String,Factor>[] assignedFactor) {
		this.target = target;
		this.site = site;
		this.experimentType = experimentType;
		this.assignedCondition = assignedCondition;
		this.assignedFactor = assignedFactor;
	}

	public Map<String,Factor>[] getAssignedFactor() {
		return this.assignedFactor;
	}

	public void setAssignedFactor(Map<String,Factor>[] assignedFactor) {
		this.assignedFactor = assignedFactor;
	}

	public String getTarget() {
		return target;
	}

	public void setTarget(String target) {
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

	public Condition[] getAssignedCondition() {
		return assignedCondition;
	}

	public void setAssignedCondition(Condition[] assignedCondition) {
		this.assignedCondition = assignedCondition;
	}

    @Override
    public String toString(){
        return "ExperimentsResponse [target=" + target + ", site=" + site 
               + ", assignedCondition=" + assignedCondition + ", assignedFactor=" + assignedFactor + "]";
    }

	public String getFactorLevel(String factor) {
		if (this.experimentType == ExperimentType.Factorial){
			//iterate through assignedFactor to see if factor is a key
			for (Map<String,Factor> map : this.assignedFactor){
				if (map.containsKey(factor)){
					return map.get(factor).getLevel();
				}
			}
			return null;
		}
		else {
			return null;
		}
	}

	public Payload getFactorPayload(String factor){
		if (this.experimentType == ExperimentType.Factorial){
			//iterate through assignedFactor to see if factor is a key
			for (Map<String,Factor> map : this.assignedFactor){
				if (map.containsKey(factor)){
					return map.get(factor).getPayload();
				}
			}
			return  null;
		}
		else {
			return null;
		}
	}
}
