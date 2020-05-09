package org.upgradeplatform.utils;

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

	public PublishingRetryCallback(AsyncInvoker invoker, Entity<T> message, int retries, InvocationCallback<Response> callback) {
		this.invoker = invoker;
		this.message = message;
		this.retries = retries;
		this.callback = callback;
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
		invoker.post(message, this);
	}


}
