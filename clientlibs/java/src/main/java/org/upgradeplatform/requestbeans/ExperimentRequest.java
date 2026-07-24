package org.upgradeplatform.requestbeans;

public class ExperimentRequest {

	private String context;
	private String site;
	private String target;

	public ExperimentRequest(String context) {
		super();
		this.context = context;
	}

	public ExperimentRequest(String context, String site, String target) {
		super();
		this.context = context;
		this.site = site;
		this.target = target;
	}

	public String getContext() {
		return context;
	}

	public void setContext(String context) {
		this.context = context;
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
