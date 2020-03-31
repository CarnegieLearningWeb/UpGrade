package responsebeans;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

public class GetExperimentCondition {

	@SerializedName("experimentId")
	@Expose
	private Object experimentId;
	@SerializedName("experimentPoint")
	@Expose
	private String experimentPoint;
	@SerializedName("uniqueIdentifier")
	@Expose
	private String uniqueIdentifier;
	@SerializedName("assignedCondition")
	@Expose
	private ExperimentConditions assignedCondition;
	
	
	public GetExperimentCondition() {};
	
	public GetExperimentCondition(Object experimentId, String experimentPoint, String uniqueIdentifier,
			ExperimentConditions assignedCondition) {
		super();
		this.experimentId = experimentId;
		this.experimentPoint = experimentPoint;
		this.uniqueIdentifier = uniqueIdentifier;
		this.assignedCondition = assignedCondition;
	}
	
	public Object getExperimentId() {
		return experimentId;
	}
	public void setExperimentId(Object experimentId) {
		this.experimentId = experimentId;
	}
	public String getExperimentPoint() {
		return experimentPoint;
	}
	public void setExperimentPoint(String experimentPoint) {
		this.experimentPoint = experimentPoint;
	}
	public String getUniqueIdentifier() {
		return uniqueIdentifier;
	}
	public void setUniqueIdentifier(String uniqueIdentifier) {
		this.uniqueIdentifier = uniqueIdentifier;
	}
	public ExperimentConditions getAssignedCondition() {
		return assignedCondition;
	}
	public void setAssignedCondition(ExperimentConditions assignedCondition) {
		this.assignedCondition = assignedCondition;
	}
	
	
}

