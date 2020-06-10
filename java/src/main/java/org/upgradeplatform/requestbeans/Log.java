package org.upgradeplatform.requestbeans;

public class Log {
	private String userId;
	private Object value;
	
	public Log(String userId, Object value) {
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
	public Object getValue() {
		return value;
	}
	public void setValue(Object value) {
		this.value = value;
	}
	
	
}
