package org.upgradeplatform.responsebeans;



import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

public class ExperimentsResponse {
	@SerializedName("name")
	@Expose
	private Object name;
	@SerializedName("point")
	@Expose
	private String point;
	@SerializedName("twoCharacterId")
	@Expose
	private String twoCharacterId;
	@SerializedName("assignedCondition")
	@Expose
	private AssignedCondition assignedCondition;

	public Object getName() {
		return name;
	}

	public void setName(Object name) {
		this.name = name;
	}

	public String getPoint() {
		return point;
	}

	public void setPoint(String point) {
		this.point = point;
	}

	public String getTwoCharacterId() {
		return twoCharacterId;
	}

	public void setTwoCharacterId(String twoCharacterId) {
		this.twoCharacterId = twoCharacterId;
	}

	public AssignedCondition getAssignedCondition() {
		return assignedCondition;
	}

	public void setAssignedCondition(AssignedCondition assignedCondition) {
		this.assignedCondition = assignedCondition;
	}
}
