package org.upgradeplatform.responsebeans;

import java.util.Map;

import org.upgradeplatform.utils.Utils.ExperimentType;

public class Assignment {

    private String target;
    private String site;
    private ExperimentType experimentType;
    private Condition assignedCondition;
    private Map<String, Factor> assignedFactor;

    public Assignment(String target, String site, ExperimentType experimentType, Condition assignedCondition) {
        this.target = target;
        this.site = site;
        this.experimentType = experimentType;
        this.assignedCondition = assignedCondition;
    }

    public Assignment(String target, String site, ExperimentType experimentType, Condition assignedCondition,
            Map<String, Factor> assignedFactor) {
        this.target = target;
        this.site = site;
        this.experimentType = experimentType;
        this.assignedCondition = assignedCondition;
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

    public ExperimentType getExperimentType() {
        return experimentType;
    }

    public void setExperimentType(ExperimentType experimentType) {
        this.experimentType = experimentType;
    }

    public Condition getAssignedCondition() {
        return assignedCondition;
    }

    public void setAssignedCondition(Condition assignedCondition) {
        this.assignedCondition = assignedCondition;
    }

    public Map<String, Factor> getAssignedFactor() {
        return assignedFactor;
    }

    public void setAssignedFactor(Map<String, Factor> assignedFactor) {
        this.assignedFactor = assignedFactor;
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

    @Override
    public String toString() {
        return "Assignment [target=" + target + ", site=" + site + ", experimentType=" + experimentType
                + ", assignedCondition=" + assignedCondition + ", assignedFactor=" + assignedFactor
                + "]";
    }

}
