package org.upgradeplatform.responsebeans;

public class ErrorResponse {
	
	private int errorCode;
	private String message;
	private String type;

	public ErrorResponse() {
		super();
	}
	
	public ErrorResponse(String message) {
		super();
		this.message= message;
	}
	
	public ErrorResponse(int errorCode, String message, String type) {
		super();
		this.errorCode= errorCode;
		this.message= message;
		this.type= type;
	}
	

	public int getErrorCode() {
		return errorCode;
	}

	public void setErrorCode(int errorCode) {
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

    @Override
    public String toString(){
        return "ErrorResponse [errorCode=" + errorCode + ", message=" + message + ", type=" + type + "]";
    }
}
