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

	public ExperimentRequest(String context, String site, String target) {
		this(context);
		this.decisionPoint = new DecisionPoint(site, target);
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

	/** The one decision point an /assign request is scoped to. */
	public static class DecisionPoint {
		private String site;

		// Null is left out, which the server reads as the decision point with no target, not every target at site.
		@JsonInclude(JsonInclude.Include.NON_NULL)
		private String target;

		public DecisionPoint(String site, String target) {
			this.site = site;
			this.target = target;
		}

		public String getSite() {
			return site;
		}

		public String getTarget() {
			return target;
		}
	}
}
