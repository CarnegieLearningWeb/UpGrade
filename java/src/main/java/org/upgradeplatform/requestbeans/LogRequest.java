package org.upgradeplatform.requestbeans;

import java.util.List;

public class LogRequest {
	private String userId;
	private List<LogInput> value;
	
	public LogRequest(String userId, List<LogInput> value) {
		super();
		this.userId = userId;
		this.value = value;
	}

	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}

	public List<LogInput> getValue() {
		return value;
	}

	public void setValue(List<LogInput> value) {
		this.value = value;
	}

}
