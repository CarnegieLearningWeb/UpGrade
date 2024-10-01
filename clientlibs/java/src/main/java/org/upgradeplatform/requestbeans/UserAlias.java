package org.upgradeplatform.requestbeans;

import java.util.List;

public class UserAlias {

	private List<String> aliases;
	
	public UserAlias(List<String> aliases) {
		super();
		this.aliases = aliases;
	}

	public List<String> getAliases() {
		return aliases;
	}

	public void setAliases(List<String> aliases) {
		this.aliases = aliases;
	}
	
}
