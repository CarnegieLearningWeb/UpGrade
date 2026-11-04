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
    private ExperimentClient experimentClient;

    public Assignment(ExperimentClient experimentClient, String target, String site, ExperimentType experimentType, Condition assignedCondition) {
        this.target = target;
        this.site = site;
        this.experimentType = experimentType;
        this.assignedCondition = assignedCondition;
        this.experimentClient = experimentClient;
    }

    public Assignment(ExperimentClient experimentClient, String target, String site, ExperimentType experimentType, Condition assignedCondition,
            Map<String, Factor> assignedFactor) {
        this.target = target;
        this.site = site;
        this.experimentType = experimentType;
        this.assignedCondition = assignedCondition;
        this.assignedFactor = assignedFactor;
        this.experimentClient = experimentClient;
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

    /**
     * The experiment type, or null when no experiment is assigned at this decision point. Check for null before
     * {@code switch}ing on it: switching on a null enum throws a NullPointerException.
     */
    public ExperimentType getExperimentType() {
        return experimentType;
    }

    public void setExperimentType(ExperimentType experimentType) {
        this.experimentType = experimentType;
    }

    /**
     * Null when no experiment is assigned at this decision point, so check it before chaining, or use
     * {@link #getPayload()} / {@link #getCondition()}, which handle that case.
     */
    public Condition getAssignedCondition() {
        return assignedCondition;
    }

    /** The assigned condition code, or null when no experiment is assigned at this decision point. */
    public String getCondition() {
        return assignedCondition == null ? null : assignedCondition.getConditionCode();
    }

    /** The assigned condition's payload, or null. */
    public Payload getPayload() {
        return assignedCondition == null ? null : assignedCondition.getPayload();
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

    public void markDecisionPoint(MarkedDecisionPointStatus status, ResponseCallback<MarkDecisionPoint> callbacks){
        this.markDecisionPoint(status, "", "", callbacks);
    }

    public void markDecisionPoint(MarkedDecisionPointStatus status, String uniquifier, ResponseCallback<MarkDecisionPoint> callbacks){
        this.markDecisionPoint(status, "", uniquifier, callbacks);
    }

    /**
     * Note the argument order differs from the JS and Python libraries, which take {@code uniquifier} before
     * {@code clientError}. With a single string argument ({@code markDecisionPoint(status, uniquifier, cb)}),
     * the string is the uniquifier.
     */
    public void markDecisionPoint(MarkedDecisionPointStatus status, String clientError, String uniquifier, ResponseCallback<MarkDecisionPoint> callbacks){
        Condition condition = assignedCondition == null ? new Condition()
                : new Condition(assignedCondition.getId(), assignedCondition.getConditionCode(),
                        assignedCondition.getExperimentId(), null);
        MarkExperimentRequestData markExperimentRequestData = new MarkExperimentRequestData(site, target, condition);
        experimentClient.markDecisionPoint(status, markExperimentRequestData, clientError, uniquifier, callbacks);
    }

    @Override
    public String toString() {
        return "Assignment [target=" + target + ", site=" + site + ", experimentType=" + experimentType
                + ", assignedCondition=" + assignedCondition + ", assignedFactor=" + assignedFactor
                + "]";
    }

}
