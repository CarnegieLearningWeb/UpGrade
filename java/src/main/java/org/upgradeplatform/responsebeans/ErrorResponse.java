package org.upgradeplatform.responsebeans;

public class ErrorResponse {
	
	private Object errorCode;
	private String message;
	private String type;

	public ErrorResponse() {
		super();
	}
	
	public ErrorResponse(String message) {
		super();
		this.message= message;
	}

	public Object getErrorCode() {
		return errorCode;
	}

	public void setErrorCode(Object errorCode) {
		this.errorCode = errorCode;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}


	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}
}
