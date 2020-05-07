package org.upgradeplatform.utils;


import javax.ws.rs.client.AsyncInvoker;
import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.core.MediaType;


public class APIService {

	public APIService(String baseUrl, String authToken) {
		this.baseUrl=baseUrl;
		this.authToken=authToken;
	}
	

	String baseUrl,authToken;
	Client client = ClientBuilder.newClient();
	
	
	public String getBaseUrl() {
		return baseUrl;
	}

	public void setBaseUrl(String baseUrl) {
		this.baseUrl = baseUrl;
	}
	

	public String getAuthToken() {
		return authToken;
	}

	public void setAuthToken(String authToken) {
		this.authToken = authToken;
	}

	public AsyncInvoker prepareRequest(String apiPath) {
		
		return client.target(this.baseUrl)
				.path(apiPath)
				.request(MediaType.APPLICATION_JSON)
				.header("Authorization", "Bearer "+this.authToken)
				.async();
	}

}
