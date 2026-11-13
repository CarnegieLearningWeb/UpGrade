package org.upgradeplatform.requestbeans;

import com.fasterxml.jackson.annotation.JsonInclude;

public class ExperimentRequest {

	private String context;

	// Left out of the JSON when null, so a full-context /assign request is unchanged.
	@JsonInclude(JsonInclude.Include.NON_NULL)
	private DecisionPoint decisionPoint;

	public ExperimentRequest(String context) {
		super();
		this.context = context;
	}

	/** A null target is sent as "", the targetless decision point, as the reward request does. */
	public ExperimentRequest(String context, String site, String target) {
		this(context);
		this.decisionPoint = new DecisionPoint(site, target == null ? "" : target);
	}

	public String getContext() {
		return context;
	}

	public void setContext(String context) {
		this.context = context;
	}

	public DecisionPoint getDecisionPoint() {
		return decisionPoint;
	}

	public void setDecisionPoint(DecisionPoint decisionPoint) {
		this.decisionPoint = decisionPoint;
	}
}
