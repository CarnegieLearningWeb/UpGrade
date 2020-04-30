package org.upgradeplatform.responsebeans;


import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

public class AssignedCondition {

	@SerializedName("twoCharacterId")
	@Expose
	private String twoCharacterId;
	@SerializedName("conditionCode")
	@Expose
	private String conditionCode;

	
	public String getTwoCharacterId() {
		return twoCharacterId;
	}

	public void setTwoCharacterId(String twoCharacterId) {
		this.twoCharacterId = twoCharacterId;
	}

	public String getConditionCode() {
		return conditionCode;
	}

	public void setConditionCode(String conditionCode) {
		this.conditionCode = conditionCode;
	}



}