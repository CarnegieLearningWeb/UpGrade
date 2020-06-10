package org.upgradeplatform.utils;
import static org.upgradeplatform.utils.Utils.*;

import javax.ws.rs.client.AsyncInvoker;
import javax.ws.rs.client.Entity;
import javax.ws.rs.client.InvocationCallback;
import javax.ws.rs.core.Response;

import static javax.ws.rs.core.Response.Status.Family.SUCCESSFUL;

public class PublishingRetryCallback<T> implements InvocationCallback<Response> {

	private final AsyncInvoker invoker;
	private final Entity<T> message;
	private final InvocationCallback<Response> callback;
	private int retries;
	private String type; // Request type

	public PublishingRetryCallback(AsyncInvoker invoker, Entity<T> message, int retries, String type ,InvocationCallback<Response> callback) {
		this.invoker = invoker;
		this.message = message;
		this.retries = retries;
		this.callback = callback;
		this.type = type;
	}

	@Override
	public void completed(Response response) {
		if (SUCCESSFUL.equals(response.getStatusInfo().getFamily()) || retries <= 0) {
			callback.completed(response);
		} else {
			retry();
		}
	}

	@Override
	public void failed(Throwable throwable) {
		if (retries > 0) {
			retry();
		} else {
			callback.failed(throwable);
		}
	}

	private void retry() {
		retries--;
		switch(this.type) {
			case REQUEST_TYPES_POST:
				invoker.post(message, this);
				break;
			case REQUEST_TYPES_GET:
				invoker.get(this);
				break;
			default:
				break;
		}
		
	}


}
