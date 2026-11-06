package org.upgradeplatform.requestbeans;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Body of POST /featureflag. The session-group fields are sent together or not at all (the server rejects one
 * without the other), so they are omitted when unset.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FeatureFlagRequest {
	private final String context;
	private final Map<String, List<String>> groupsForSession;
	private final Boolean includeStoredUserGroups;

	public FeatureFlagRequest(String context, Map<String, List<String>> groupsForSession,
			Boolean includeStoredUserGroups) {
		this.context = context;
		this.groupsForSession = groupsForSession;
		this.includeStoredUserGroups = includeStoredUserGroups;
	}

	public String getContext() {
		return context;
	}

	public Map<String, List<String>> getGroupsForSession() {
		return groupsForSession;
	}

	public Boolean getIncludeStoredUserGroups() {
		return includeStoredUserGroups;
	}
}
