package utils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import responsebeans.InitRequest;

public class Utils
{
//	public static List<ExperimentsResponse> experimentsResponse = null;
//	public static String studentId = "";

	private static final String EMPTY = "";
	
	public static String BASE_URL  = "";
	
	public static final String INVALID_INIT_USER_DATA = "Invalid user init data";
	public static final String INVALID_GROUP_MEMBERSHIP_DATA = "Invalid user group data";
	public static final String INVALID_WORKING_GROUP_DATA = "Invalid user working group data";
	public static final String INVALID_STUDENT_ID = "Invalid student id. It must be valid string";
	public static final String INVALID_MARK_EXPERIMENT_DATA = "Invalid mark experiment data";
	public static final String INVALID_FAILED_EXPERIMENT_DATA = "Invalid failed experiment data";
	
	public boolean isStringNull(final String str) {
		return str == null || str.equals(EMPTY);
	}

	public boolean validateInitData(final InitRequest initRequest) {
		if (isStringNull(initRequest.getId())) {
			return false;
		}
		if(!(initRequest.getGroup() instanceof Map) || !(initRequest.getWorkingGroup() instanceof Map) ) {
			return false;
		}
		
//		if (!this.isSubset(initRequest.getGroup().getClasses(), initRequest.getWorkingGroup().getClasses())) {
//			return false;
//		}
//		if (!this.isSubset(initRequest.getGroup().getTeacher(), initRequest.getWorkingGroup().getTeacher())) {
//			return false;
//		}
		return true;
	}

	private boolean isSubset(final List<String> group, final String subGroup) {
		if (group.size() > 0 && !isStringNull(subGroup)) {
			return group.contains(subGroup);
		}
		return group.size() != 0 || isStringNull(subGroup) || group.contains(subGroup);
	}

	public boolean validateGroupMembershipData(final HashMap<String, ArrayList<String>> group) {

		if (!(group instanceof Map) ) {
			return false;
		}
		return true;
	}

}
