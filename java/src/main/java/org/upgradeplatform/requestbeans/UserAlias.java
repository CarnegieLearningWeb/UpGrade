package org.upgradeplatform.requestbeans;

public class UserAlias {

	private String[] aliases;
	private String userId;
	
	public UserAlias(){}
	
	public UserAlias( String userId, String[] aliases) {
		super();
		this.aliases = aliases;
		this.userId = userId;
	}

	public String[] getAliases() {
		return aliases;
	}

	public void setAliases(String[] aliases) {
		this.aliases = aliases;
	}

	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}
	
	
	
}
