package org.upgradeplatform.requestbeans;

import org.upgradeplatform.responsebeans.Condition;

public class MarkExperimentRequestData {

  private String site;
  private String target;
  private Condition assignedCondition;
  private Object assignedFactor;

  public MarkExperimentRequestData(){
    super();
  }

  public MarkExperimentRequestData(String site, String target){
    super();
    this.site = site;
    this.target = target;
  }

  public MarkExperimentRequestData(String site, String target, Condition assignedCondition){
    super();
    this.site = site;
    this.target = target;
    this.assignedCondition = assignedCondition;
  }
  
  public MarkExperimentRequestData(String site, String target, Condition assignedCondition, Object assignedFactor){
    super();
    this.site = site;
    this.target = target;
    this.assignedCondition = assignedCondition;
    this.assignedFactor = assignedFactor;
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
    this.assignedCondition = assignedCondition;
  }

  public Object getAssignedFactor() {
    return this.assignedFactor;
  }

  public void setAssignedFactor(Object assignedFactor) {
    this.assignedFactor = assignedFactor;
  }
    
}
