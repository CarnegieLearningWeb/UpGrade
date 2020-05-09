package org.upgradeplatform.utils;


import javax.ws.rs.client.AsyncInvoker;
import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.core.MediaType;

import org.glassfish.jersey.client.ClientProperties;


public class APIService {

	String baseUrl,authToken;
	private Client client;
	
	public APIService(String baseUrl, String authToken) {
		this.baseUrl=baseUrl;
		this.authToken=authToken;
		if(client == null) {
			createClient();
		}

	}

	public void createClient() {
		client = ClientBuilder.newClient();
		client.property(ClientProperties.CONNECT_TIMEOUT, 3000);
		client.property(ClientProperties.READ_TIMEOUT,    3000);
	}
	public String getBaseUrl() {
		return baseUrl;
	}
	public String getAuthToken() {
		return authToken;
	}

	public AsyncInvoker prepareRequest(String apiPath) {

		return client.target(this.baseUrl)
				.path(apiPath)
				.request(MediaType.APPLICATION_JSON)
				.header("Authorization", "Bearer "+this.authToken)
				.async();
	}

	public void close() {
		client.close();
	}
}
