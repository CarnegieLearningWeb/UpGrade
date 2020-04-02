package responsebeans;

import java.util.List;
import java.util.Map;

public class InitRequest
{
	public String id;
	public Map<String, List<String>> group;
	public Map<String, String> workingGroup;
	
	public InitRequest(String id, Map<String, List<String>> group, Map<String, String> workingGroup) {
		super();
		this.id = id;
		this.group = group;
		this.workingGroup = workingGroup;
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
	

}
