package requestbeans;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

public class FailedExperimentPointRequest {

	@SerializedName("experimentPoint")
	@Expose
	private String experimentPoint;
	@SerializedName("experimentId")
	@Expose
	private String experimentId;
	@SerializedName("reason")
	@Expose
	private String reason;
	
	public FailedExperimentPointRequest(String experimentPoint, String experimentId, String reason) {
		super();
		this.experimentPoint = experimentPoint;
		this.experimentId = experimentId;
		this.reason = reason;
	}
	
	public String getExperimentPoint() {
		return experimentPoint;
	}
	public void setExperimentPoint(String experimentPoint) {
		this.experimentPoint = experimentPoint;
	}
	public String getExperimentId() {
		return experimentId;
	}
	public void setExperimentId(String experimentId) {
		this.experimentId = experimentId;
	}
	public String getReason() {
		return reason;
	}
	public void setReason(String reason) {
		this.reason = reason;
	}
	
	
	
	
}
