package org.upgradeplatform.responsebeans;

import java.util.List;

public class FeatureFlag {


	private String createdAt;
	private String updatedAt;
	private Integer versionNumber;
	private String id;
	private String name;
	private String key;
	private String description;
	private String variationType;
	private Boolean status;
	private List<Variation> variations = null;

	public FeatureFlag() {}
	
	// To make a deep Copy 
	public FeatureFlag(FeatureFlag flag) {
		this.createdAt = flag.getCreatedAt();
		this.updatedAt = flag.getUpdatedAt();
		this.versionNumber = flag.getVersionNumber();
		this.id = flag.getId();
		this.name = flag.getName();
		this.key = flag.getKey();
		this.description = flag.getDescription();
		this.variationType = flag.getVariationType();
		this.status = flag.getStatus();
		this.variations = flag.getVariations();
	}
	

	public FeatureFlag(String createdAt, String updatedAt, Integer versionNumber, String id, String name, String key, String description, String variationType, Boolean status, List<Variation> variations) {
		super();
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
		this.versionNumber = versionNumber;
		this.id = id;
		this.name = name;
		this.key = key;
		this.description = description;
		this.variationType = variationType;
		this.status = status;
		this.variations = variations;
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

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getKey() {
		return key;
	}

	public void setKey(String key) {
		this.key = key;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getVariationType() {
		return variationType;
	}

	public void setVariationType(String variationType) {
		this.variationType = variationType;
	}

	public Boolean getStatus() {
		return status;
	}

	public void setStatus(Boolean status) {
		this.status = status;
	}

	public List<Variation> getVariations() {
		return variations;
	}

	public void setVariations(List<Variation> variations) {
		this.variations = variations;
	}


}
