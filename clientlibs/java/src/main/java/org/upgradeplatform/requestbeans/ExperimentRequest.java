package org.upgradeplatform.requestbeans;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ExperimentRequest {

	public static class DecisionPoint {
		private String site;
		private String target;

		public DecisionPoint(String site, String target) {
			this.site = site;
			this.target = target;
		}

		public String getSite() {
			return site;
		}

		public void setSite(String site) {
			this.site = site;
		}

		public String getTarget() {
			return target;
		}

		public void setTarget(String target) {
			this.target = target;
		}
	}

	private String context;
	private DecisionPoint decisionPoint;

	public ExperimentRequest(String context) {
		super();
		this.context = context;
	}

	public ExperimentRequest(String context, String site, String target) {
		super();
		this.context = context;
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
}
