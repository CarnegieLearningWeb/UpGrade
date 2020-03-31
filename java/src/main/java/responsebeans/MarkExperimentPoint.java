package responsebeans;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

public class MarkExperimentPoint {
	
	@SerializedName("userId")
	@Expose
	private String userId;
	@SerializedName("experimentId")
	@Expose
	private String experimentId;
	@SerializedName("experimentPoint")
	@Expose
	private String experimentPoint;
	
	
	public MarkExperimentPoint(String userId, String experimentId, String experimentPoint) {
		super();
		this.userId = userId;
		this.experimentId = experimentId;
		this.experimentPoint = experimentPoint;
	}


	public String getUserId() {
		return userId;
	}


	public void setUserId(String userId) {
		this.userId = userId;
	}


	public String getExperimentId() {
		return experimentId;
	}


	public void setExperimentId(String experimentId) {
		this.experimentId = experimentId;
	}


	public String getExperimentPoint() {
		return experimentPoint;
	}


	public void setExperimentPoint(String experimentPoint) {
		this.experimentPoint = experimentPoint;
	}


    
}
