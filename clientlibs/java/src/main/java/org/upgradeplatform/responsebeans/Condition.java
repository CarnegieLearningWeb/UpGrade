package org.upgradeplatform.responsebeans;

public class Condition {

    private String id;
    private String conditionCode;
    private String payload;
    private String experimentId;

    public Condition() {
		super();
	}

    public Condition(String conditionCode) {
        super();
        this.conditionCode= conditionCode;
    }

    public Condition(String conditionCode, String experimentId){
        super();
        this.conditionCode= conditionCode;
        this.experimentId = experimentId;
    }
	
	public Condition(String id, String conditionCode, String experimentId, String payload) {
		super();
        this.id = id;
		this.conditionCode= conditionCode;
        this.experimentId = experimentId;
	}

    public String getConditionCode() {
        return conditionCode;
    }

    public void setCondition(String conditionCode) {
        this.conditionCode = conditionCode;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getExperimentId() {
        return experimentId;
    }

    public void setExperimentId(String experimentId) {
        this.experimentId = experimentId;
    }

    public String getPayload() {
        return payload;
    }

    public void setPayload(String payload) {
        this.payload = payload;
    }

    @Override
    public String toString(){
        return  "Condition [conditionCode=" + conditionCode + "]";
    }
    
}
