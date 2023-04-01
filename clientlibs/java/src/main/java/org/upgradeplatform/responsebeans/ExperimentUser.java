package org.upgradeplatform.responsebeans;

import java.util.List;
import java.util.Map;

public class ExperimentUser
{
	
	private String createdAt;
	private String updatedAt;
	private Integer versionNumber;
	private String id;
	private Map<String, List<String>> group;
	private Map<String, String> workingGroup;
	private String requestedUserId;
	public ExperimentUser() {}
	
	public ExperimentUser(String id, Map<String, List<String>> group, Map<String, String> workingGroup, String requestedUserId) {
		super();
		this.id = id;
		this.group = group;
		this.workingGroup = workingGroup;
		this.requestedUserId = requestedUserId;
	}
	
	public ExperimentUser(String id, Map<String, List<String>> group, Map<String, String> workingGroup ) {
		super();
		this.id = id;
		this.group = group;
		this.workingGroup = workingGroup;
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
	public Map<String, List<String>> getGroup() {
		return group;
	}
	public void setGroup(Map<String, List<String>> group) {
		this.group = group;
	}
	public Map<String, String> getWorkingGroup() {
		return workingGroup;
	}
	public void setWorkingGroup(Map<String, String> workingGroup) {
		this.workingGroup = workingGroup;
	}

	public String getRequestedUserId() {
		return requestedUserId;
	}

	public void setOriginalUser(String requestedUserId) {
		this.requestedUserId = requestedUserId;
	}
	
	@Override
    public String toString(){
        return "ExperimentUser [id=" + id + ", group=" + group 
               + ", workingGroup=" + workingGroup + "]";
    }
}
