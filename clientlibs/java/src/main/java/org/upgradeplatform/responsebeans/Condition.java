package org.upgradeplatform.responsebeans;

public class Condition {

    private String condition;

    public Condition() {
		super();
	}
	
	public Condition(String condition) {
		super();
		this.condition= condition;
	}

    public String getCondition() {
        return condition;
    }

    public void setCondition(String condition) {
        this.condition = condition;
    }

    @Override
    public String toString(){
        return  "Condition [assignedCondition=" + condition + "]";
    }
    
}
