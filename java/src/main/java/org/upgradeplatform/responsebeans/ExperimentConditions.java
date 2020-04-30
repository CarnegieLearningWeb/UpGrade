package org.upgradeplatform.responsebeans;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

public class ExperimentConditions {
	@SerializedName("uniqueIdentifier")
	@Expose
	private String uniqueIdentifier;
	@SerializedName("condition")
	@Expose
	private String condition;
	
	
	public ExperimentConditions( String condition, String uniqueIdentifier) {
		super();
		this.uniqueIdentifier = uniqueIdentifier;
		this.condition = condition;
	}
	
	
	public String getUniqueIdentifier() {
		return uniqueIdentifier;
	}
	public void setUniqueIdentifier(String uniqueIdentifier) {
		this.uniqueIdentifier = uniqueIdentifier;
	}
	public String getCondition() {
		return condition;
	}
	public void setCondition(String condition) {
		this.condition = condition;
	}
	

	

}
