package org.upgradeplatform.requestbeans;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

public class MarkExperimentRequest {

	@SerializedName("userId")
	@Expose
	private String userId;
	@SerializedName("experimentPoint")
	@Expose
	private String experimentPoint;
	@SerializedName("partitionId")
	@Expose
	private String partitionId;

	public MarkExperimentRequest(String userId, String experimentPoint, String partitionId) {
		super();
		this.userId = userId;
		this.experimentPoint = experimentPoint;
		this.partitionId = partitionId;
	}

	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}

	public String getExperimentPoint() {
		return experimentPoint;
	}

	public void setExperimentPoint(String experimentPoint) {
		this.experimentPoint = experimentPoint;
	}

	public String getPartitionId() {
		return partitionId;
	}

	public void setPartitionId(String partitionId) {
		this.partitionId = partitionId;
	}

}
