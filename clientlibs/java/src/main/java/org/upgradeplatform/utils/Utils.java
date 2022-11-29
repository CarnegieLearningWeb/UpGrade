package org.upgradeplatform.utils;

import java.util.Arrays;
import java.util.stream.Collectors;

public class Utils
{
	private static final String EMPTY = "";


	public static final String INVALID_BASE_URL = "Provided base url is invalid";
	public static final String INVALID_AUTH_TOKEN = "Provided auth token is invalid";
	public static final String INVALID_STUDENT_ID = "Provided User id is invalid";
	public static final String INVALID_INIT_USER_DATA = "Invalid user init data";
	public static final String INVALID_GROUP_MEMBERSHIP_DATA = "Invalid user group data";
	public static final String INVALID_WORKING_GROUP_DATA = "Invalid user working group data";
	public static final String INVALID_MARK_EXPERIMENT_DATA = "Invalid mark experiment data";
	public static final String INVALID_FAILED_EXPERIMENT_DATA = "Invalid failed experiment data";
	public static final String FEATURE_FLAGS_EMPTY= "No active feature flags found";
	public static final String INVALID_FEATURE_FLAG_KEY= "Feature flag with given key not found";
	public static final String INVALID_METRIC_META_DATA= "Invalid metadata type provided. It should be of MetricMetaData enum type";


	public static final String INITIALIZE_USER= "api/init";
	public static final String SET_GROUP_MEMBERSHIP= "api/groupmembership";
	public static final String SET_WORKING_GROUP= "api/workinggroup";
	public static final String GET_ALL_EXPERIMENTS= "api/assign";
	public static final String MARK_EXPERIMENT_POINT= "api/mark";
	public static final String FAILED_EXPERIMENT_POINT= "api/failed";
	public static final String GET_ALL_FEATURE_FLAGS= "api/featureflag";
	public static final String LOG_EVENT= "api/log";
	public static final String SET_ALT_USER_IDS= "api/useraliases";
	public static final String ADD_MATRIC= "api/metric";

	public static final String PATCH = "PATCH";
	
	public static final int MAX_RETRIES = 3;


	public static enum RequestType {
		GET,
		POST,
		PATCH
	}
	
	public static enum MetricMetaData {
		continuous,
		categorical
	}

	public static enum MarkedDecisionPointStatus {
		CONDITION_APPLIED("condition applied"),
  		CONDITION_FAILED_TO_APPLY("condition not applied"),
  		NO_CONDITION_ASSIGNED("no condition assigned");

		private final String toString;

		private MarkedDecisionPointStatus(String toString) {
			this.toString = toString;
	   	}
   
	   	public String toString(){
			return toString;
	   	}
	}

	public static boolean isValidMetricMetaDataString(final String metadataType) {
		return Arrays.stream(MetricMetaData.values())
				.map(MetricMetaData::name)
				.collect(Collectors.toSet())
				.contains(metadataType);
	}

	public static boolean isStringNull(final String str) {
		return str == null || str.equals(EMPTY);
	}
}
