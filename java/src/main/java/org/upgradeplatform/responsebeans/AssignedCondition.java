package org.upgradeplatform.responsebeans;

public class AssignedCondition {

	private String createdAt;
	private String updatedAt;
	private Integer versionNumber;
	private String id;
	private String twoCharacterId;
	private String name;
	private String description;
	private String conditionCode;
	private Integer assignmentWeight;
	
	public AssignedCondition() {}
	
	
	public AssignedCondition( String twoCharacterId, String conditionCode, String description) {
		super();
		this.twoCharacterId = twoCharacterId;
		this.conditionCode = conditionCode;
		this.description = description;
	}
	
	public AssignedCondition(String createdAt, String updatedAt, Integer versionNumber, String id,
			String twoCharacterId, String name, String description, String conditionCode, Integer assignmentWeight) {
		super();
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
		this.versionNumber = versionNumber;
		this.id = id;
		this.twoCharacterId = twoCharacterId;
		this.name = name;
		this.description = description;
		this.conditionCode = conditionCode;
		this.assignmentWeight = assignmentWeight;
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
	public String getTwoCharacterId() {
		return twoCharacterId;
	}
	public void setTwoCharacterId(String twoCharacterId) {
		this.twoCharacterId = twoCharacterId;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public String getDescription() {
		return description;
	}
	public void setDescription(String description) {
		this.description = description;
	}
	public String getConditionCode() {
		return conditionCode;
	}
	public void setConditionCode(String conditionCode) {
		this.conditionCode = conditionCode;
	}
	public Integer getAssignmentWeight() {
		return assignmentWeight;
	}
	public void setAssignmentWeight(Integer assignmentWeight) {
		this.assignmentWeight = assignmentWeight;
	}

	
	


}