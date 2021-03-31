package org.upgradeplatform.responsebeans;

import java.util.List;

public class Variation {

	private String createdAt;
	private String updatedAt;
	private Integer versionNumber;
	private String id;
	private String value;
	private Object name;
	private Object description;
	private List<Boolean> defaultVariation = null;

	
	public Variation() {}

	public Variation(String createdAt, String updatedAt, Integer versionNumber, String id, String value, Object name, Object description, List<Boolean> defaultVariation) {
		super();
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
		this.versionNumber = versionNumber;
		this.id = id;
		this.value = value;
		this.name = name;
		this.description = description;
		this.defaultVariation = defaultVariation;
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

	public Integer getVersionNumber() {
		return versionNumber;
	}

	public void setVersionNumber(Integer versionNumber) {
		this.versionNumber = versionNumber;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getValue() {
		return value;
	}

	public void setValue(String value) {
		this.value = value;
	}

	public Object getName() {
		return name;
	}

	public void setName(Object name) {
		this.name = name;
	}

	public Object getDescription() {
		return description;
	}

	public void setDescription(Object description) {
		this.description = description;
	}

	public List<Boolean> getDefaultVariation() {
		return defaultVariation;
	}

	public void setDefaultVariation(List<Boolean> defaultVariation) {
		this.defaultVariation = defaultVariation;
	}

}
