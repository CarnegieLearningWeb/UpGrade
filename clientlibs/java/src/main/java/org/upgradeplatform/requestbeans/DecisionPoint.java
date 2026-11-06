package org.upgradeplatform.requestbeans;

public class DecisionPoint {
	private String site;
	private String target;

	public DecisionPoint() {
	}

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

	@Override
	public String toString() {
		return "DecisionPoint [site=" + site + ", target=" + target + "]";
	}
}
