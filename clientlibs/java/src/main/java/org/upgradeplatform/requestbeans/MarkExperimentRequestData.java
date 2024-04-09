package org.upgradeplatform.requestbeans;

import org.upgradeplatform.responsebeans.Condition;

public class MarkExperimentRequestData {

  private String site;
  private String target;
  private Condition assignedCondition = new Condition();

  public MarkExperimentRequestData() {
    super();
  }

  public MarkExperimentRequestData(String site, String target) {
    super();
    this.site = site;
    this.target = target;
  }

  public MarkExperimentRequestData(String site, String target, Condition assignedCondition) {
    super();
    this.site = site;
    this.target = target;
    this.assignedCondition = assignedCondition != null ? assignedCondition : new Condition();
  }

  public String getSite() {
    return this.site;
  }

  public void setSite(String site) {
    this.site = site;
  }

  public String getTarget() {
    return this.target;
  }

  public void setTarget(String target) {
    this.target = target;
  }

  public Condition getAssignedCondition() {
    return this.assignedCondition;
  }

  public void setAssignedCondition(Condition assignedCondition) {
    this.assignedCondition = assignedCondition != null ? assignedCondition : new Condition();
  }

}
