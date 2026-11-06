package org.upgradeplatform.responsebeans;

import org.upgradeplatform.requestbeans.RewardRequest;

public class SendRewardResponse {
	/** "accepted" = queued for background processing; "processed" = recorded synchronously (awaitResult=true) */
	private String mode;
	/** Only present when mode is "processed" */
	private Boolean success;
	private String message;
	private RewardRequest request;

	public SendRewardResponse() {
	}

	public String getMode() {
		return mode;
	}

	public void setMode(String mode) {
		this.mode = mode;
	}

	public Boolean getSuccess() {
		return success;
	}

	public void setSuccess(Boolean success) {
		this.success = success;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}

	public RewardRequest getRequest() {
		return request;
	}

	public void setRequest(RewardRequest request) {
		this.request = request;
	}

	@Override
	public String toString() {
		return "SendRewardResponse [mode=" + mode + ", success=" + success + ", message=" + message + ", request="
				+ request + "]";
	}
}
