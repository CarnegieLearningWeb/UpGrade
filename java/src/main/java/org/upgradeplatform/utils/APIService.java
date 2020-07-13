package org.upgradeplatform.utils;


import static org.upgradeplatform.utils.Utils.*;


import javax.ws.rs.client.AsyncInvoker;
import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.core.MediaType;

import org.glassfish.jersey.client.ClientProperties;


public class APIService implements AutoCloseable{

	private final String baseUrl,authToken;
	private final Client client;
	
	public APIService(String baseUrl, String authToken) {
        if (isStringNull(baseUrl)) {
            throw new IllegalArgumentException(INVALID_BASE_URL);
        }
		this.baseUrl=baseUrl;

		if (isStringNull(authToken)) {
		    throw new IllegalArgumentException(INVALID_AUTH_TOKEN);
		}
		this.authToken=authToken;

		client = createClient();
	}

	public static Client createClient() {
		Client client = ClientBuilder.newClient();
		client.property(ClientProperties.CONNECT_TIMEOUT, 3000);
		client.property(ClientProperties.READ_TIMEOUT,    3000);
		return client;
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

	@Override
    public void close() {
		client.close();
	}
}
