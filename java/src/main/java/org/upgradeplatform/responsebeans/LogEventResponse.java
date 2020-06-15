package org.upgradeplatform.responsebeans;

import io.vavr.control.Either;

public class LogEventResponse<T> {

	private String createdAt;
	private String updatedAt;
	private int versionNumber;
	private int id;
	private Either<Integer, Either<String, T >>  data;
	private Metric[] metrics;
	private InitRequest user;

	public LogEventResponse() {}

	public LogEventResponse(String createdAt, String updatedAt, int versionNumber, int id, Object data,
			Metric[] metrics, InitRequest user) {
		super();
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
		this.versionNumber = versionNumber;
		this.id = id;
		this.data = getEitherData(data);
		this.metrics = metrics;
		this.user = user;
	}

	public String getCreatedAt() {
		return createdAt;
	}
	public void setCreatedAt(String createdAt) {
		this.createdAt = createdAt;
	}
	public String getUpdatedAt() {
		return updatedAt;
	}
	public void setUpdatedAt(String updatedAt) {
		this.updatedAt = updatedAt;
	}
	public int getVersionNumber() {
		return versionNumber;
	}
	public void setVersionNumber(int versionNumber) {
		this.versionNumber = versionNumber;
	}
	public int getId() {
		return id;
	}
	public void setId(int id) {
		this.id = id;
	}
	public Either<Integer, Either<String, T >>  getData() {
		return data;
	}
	public void setData(Object data) {
		this.data = getEitherData(data);
	}
	public Metric[] getMetrics() {
		return metrics;
	}
	public void setMetrics(Metric[] metrics) {
		this.metrics = metrics;
	}
	public InitRequest getUser() {
		return user;
	}
	public void setUser(InitRequest user) {
		this.user = user;
	}


	// This method constructs Either type for the field data in response returned by server. 
	@SuppressWarnings("unchecked")
	private Either<Integer, Either<String, T>> getEitherData(Object value) {
		return (value instanceof Integer) ? 
				Either.left((int) value) : 
					value instanceof String ? Either.right(Either.left(value.toString())) :
						Either.right(Either.right((T)value));
	}

}
