package responsebeans;

import java.util.ArrayList;
import java.util.HashMap;

public class InitRequest
{
	public String id;
	public HashMap<String, ArrayList<String>> group;
	public HashMap<String, String> workingGroup;
	
	public InitRequest(String id, HashMap<String, ArrayList<String>> group, HashMap<String, String> workingGroup) {
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
	public HashMap<String, ArrayList<String>> getGroup() {
		return group;
	}
	public void setGroup(HashMap<String, ArrayList<String>> group) {
		this.group = group;
	}
	public HashMap<String, String> getWorkingGroup() {
		return workingGroup;
	}
	public void setWorkingGroup(HashMap<String, String> workingGroup) {
		this.workingGroup = workingGroup;
	}
	

}
