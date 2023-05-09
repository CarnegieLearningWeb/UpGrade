package org.upgradeplatform.responsebeans;

public class Condition {

    private String id;
    private String conditionCode;
    private Payload payload;
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
	
	public Condition(String id, String conditionCode, String experimentId, Payload payload) {
		super();
        this.id = id;
		this.conditionCode= conditionCode;
        this.experimentId = experimentId;
        this.payload = payload;
	}

    /** If your experiment site is not data-driven, this code identifies which
     * condition should be given. If your experiment site is data-driven, use
     * {@link Payload#getValue()} instead.
     * <p>
     * In general, which one to use requires prior agreement with the experimenter
     * who configures the experiments in UpGrade.
     * <p>
     * An example of a non-data-driven experiment site would be the part of the app
     * that gives feedback to a student, either textual or audio. Those two are the
     * only conditions that the code supports, there is nothing data-driven about
     * it.
     * <p>
     * An example of a data-driven experiment site would be the part of the app that
     * renders an iFrame containing an arbitrary URL. The payload would contain the
     * URL to load. This is totally data-driven, the app has no idea up front what
     * URLs might be assigned in various conditions. */
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

    /** {@see #getConditionCode()} */
    public Payload getPayload() {
        return payload;
    }

    public void setPayload(Payload payload) {
        this.payload = payload;
    }

    @Override
    public String toString(){
        return  "Condition [conditionCode=" + conditionCode + ", payload=" + payload + "]";
    }
    
}
