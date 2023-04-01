package org.upgradeplatform.responsebeans;

import java.util.List;

public class UserAliasResponse
{
	
	private String userId;
	private List<String> aliases;
	public UserAliasResponse() {}
	
	public UserAliasResponse(String userId, List<String> aliases) {
		super();
		this.userId = userId;
		this.aliases = aliases;
	}
	
	public String getUserId() {
		return userId;
	}
	public void setUserId(String id) {
		this.userId = id;
	}
	public List<String> getAliases() {
		return aliases;
	}
	public void setAliases(List<String> aliases) {
		this.aliases = aliases;
	}

	@Override
    public String toString(){
        return "UserAliasResponse [uerId=" + userId + ", aliases=" + aliases + "]";
    }

}
