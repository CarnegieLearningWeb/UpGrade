package org.upgradeplatform.utils;

public class Utils
{
//	public static List<ExperimentsResponse> experimentsResponse = null;
//	public static String studentId = "";

	private static final String EMPTY = "";
	
	
	public static final String INVALID_BASE_URL = "Provided base url is invalid";
	public static final String INVALID_AUTH_TOKEN = "Provided auth token is invalid";
	public static final String INVALID_STUDENT_ID = "Provided User id is invalid";
	
	public static final String INVALID_INIT_USER_DATA = "Invalid user init data";
	public static final String INVALID_GROUP_MEMBERSHIP_DATA = "Invalid user group data";
	public static final String INVALID_WORKING_GROUP_DATA = "Invalid user working group data";
	
	public static final String INVALID_MARK_EXPERIMENT_DATA = "Invalid mark experiment data";
	public static final String INVALID_FAILED_EXPERIMENT_DATA = "Invalid failed experiment data";
	
	
	public static boolean isStringNull(final String str) {
		return str == null || str.equals(EMPTY);
	}
}
