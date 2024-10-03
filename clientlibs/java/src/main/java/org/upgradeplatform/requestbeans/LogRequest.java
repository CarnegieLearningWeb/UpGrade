package org.upgradeplatform.requestbeans;

import java.util.List;

public class LogRequest {
	private List<LogInput> value;
	
	public LogRequest(List<LogInput> value) {
		super();
		this.value = value;
	}

	public List<LogInput> getValue() {
		return value;
	}

	public void setValue(List<LogInput> value) {
		this.value = value;
	}

}
