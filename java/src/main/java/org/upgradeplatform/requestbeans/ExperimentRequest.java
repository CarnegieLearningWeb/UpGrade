package org.upgradeplatform.requestbeans;
import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

public class ExperimentRequest {
	
	@SerializedName("userId")
	@Expose
	private String userId;
	@SerializedName("context")
	@Expose
	private String context;
	
	public ExperimentRequest(String userId, String context) {
		super();
		this.userId = userId;
		this.context = context;
	}

	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}

	public String getContext() {
		return context;
	}

	public void setContext(String context) {
		this.context = context;
	}
	
}
