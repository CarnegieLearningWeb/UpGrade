package org.upgradeplatform.utils;


import static org.upgradeplatform.utils.Utils.*;

import java.util.Map;

import javax.ws.rs.client.AsyncInvoker;
import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.core.MediaType;

import org.glassfish.jersey.client.ClientProperties;
import org.glassfish.jersey.client.HttpUrlConnectorProvider;
import org.glassfish.jersey.apache.connector.ApacheConnectorProvider;
import org.glassfish.jersey.client.ClientConfig;


public class APIService implements AutoCloseable{

	private final String baseUrl;
	private final String authToken;
	private final String sessionId;
	private final String userId;
	private final Client client;
	
	public APIService(String baseUrl, String authToken, String sessionId, String userId, Map<String, Object> properties) {
        if (isStringNull(baseUrl)) {
            throw new IllegalArgumentException(INVALID_BASE_URL);
        }
		this.baseUrl=baseUrl;

		if (isStringNull(authToken)) {
		    throw new IllegalArgumentException(INVALID_AUTH_TOKEN);
		}
		this.authToken=authToken;

		this.userId=userId;
		this.sessionId=sessionId;
		client = createClient(properties);
	}

	public static Client createClient(Map<String,Object> properties) {
		Client client = ClientBuilder.newClient(new ClientConfig().connectorProvider(new ApacheConnectorProvider()));
		client.property(ClientProperties.CONNECT_TIMEOUT, 3000);
		client.property(ClientProperties.READ_TIMEOUT,    3000);
		properties.entrySet().stream()
		          .forEachOrdered(p -> client.property(p.getKey(),
		                                               p.getValue()));
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
				.header("Session-Id", this.sessionId)
				.header("User-Id", this.userId)
				.property(HttpUrlConnectorProvider.SET_METHOD_WORKAROUND, true)
				.async();
	}

	@Override
    public void close() {
		client.close();
	}
}