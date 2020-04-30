package org.upgradeplatform.responsebeans;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

public class ErrorResponse {
	@SerializedName("errorCode")
	@Expose
	private Object errorCode;
	@SerializedName("message")
	@Expose
	private String message;
	@SerializedName("type")
	@Expose
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
