package org.upgradeplatform.requestbeans;

import java.util.List;

public class UserAlias {

	private List<String> aliases;
	private String userId;
	
	public UserAlias(){}
	
	public UserAlias( String userId, List<String> aliases) {
		super();
		this.aliases = aliases;
		this.userId = userId;
	}

	public List<String> getAliases() {
		return aliases;
	}

	public void setAliases(List<String> aliases) {
		this.aliases = aliases;
	}

	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}
	
	
	
}
