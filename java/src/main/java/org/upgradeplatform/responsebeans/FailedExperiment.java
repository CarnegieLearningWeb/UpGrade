package org.upgradeplatform.responsebeans;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

public class FailedExperiment {
	@SerializedName("id")
	@Expose
	private Integer id;
	@SerializedName("endPoint")
	@Expose
	private Object endPoint;
	@SerializedName("errorCode")
	@Expose
	private Object errorCode;
	@SerializedName("message")
	@Expose
	private String message;
	@SerializedName("name")
	@Expose
	private Object name;
	@SerializedName("type")
	@Expose
	private String type;


	public FailedExperiment(Integer id, Object endPoint, Object errorCode, String message, Object name, String type) {
		super();
		this.id = id;
		this.endPoint = endPoint;
		this.errorCode = errorCode;
		this.message = message;
		this.name = name;
		this.type = type;
	}

	public FailedExperiment(String type, String message) {
		super();
		this.message = message;
		this.type = type;
	}

	public Integer getId() {
		return id;
	}

	public void setId(Integer id) {
		this.id = id;
	}

	public Object getEndPoint() {
		return endPoint;
	}

	public void setEndPoint(Object endPoint) {
		this.endPoint = endPoint;
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

	public Object getName() {
		return name;
	}

	public void setName(Object name) {
		this.name = name;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}
}
