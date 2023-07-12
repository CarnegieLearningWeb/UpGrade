package org.upgradeplatform.responsebeans;

import java.util.Map;

import org.upgradeplatform.client.ExperimentClient;
import org.upgradeplatform.interfaces.ResponseCallback;
import org.upgradeplatform.requestbeans.MarkExperimentRequestData;
import org.upgradeplatform.utils.Utils.ExperimentType;
import org.upgradeplatform.utils.Utils.MarkedDecisionPointStatus;

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

    public void markExperimentPoint(ExperimentClient experimentClient, MarkedDecisionPointStatus status, ResponseCallback<MarkExperimentPoint> callbacks){
        this.markExperimentPoint(experimentClient, status, "", "", callbacks);
    }

    public void markExperimentPoint(ExperimentClient experimentClient, MarkedDecisionPointStatus status, String uniquifier, ResponseCallback<MarkExperimentPoint> callbacks){
        this.markExperimentPoint(experimentClient, status, "", uniquifier, callbacks);
    }

    public void markExperimentPoint(ExperimentClient experimentClient, MarkedDecisionPointStatus status, String clientError, String uniquifier, ResponseCallback<MarkExperimentPoint> callbacks){
        String code = assignedCondition == null  ? null : assignedCondition.getConditionCode();
        MarkExperimentRequestData markExperimentRequestData = new MarkExperimentRequestData(site, target, new Condition(code));
        experimentClient.markExperimentPoint(status, markExperimentRequestData, clientError, uniquifier, callbacks);
    }

    @Override
    public String toString() {
        return "Assignment [target=" + target + ", site=" + site + ", experimentType=" + experimentType
                + ", assignedCondition=" + assignedCondition + ", assignedFactor=" + assignedFactor
                + "]";
    }

}
