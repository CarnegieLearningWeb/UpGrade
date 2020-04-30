package org.upgradeplatform.utils;

import java.io.IOException;
import java.lang.annotation.Annotation;
import java.lang.reflect.Type;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicInteger;

import org.eclipse.jdt.annotation.NonNull;
import org.eclipse.jdt.annotation.Nullable;
import org.upgradeplatform.interfaces.Retry;

import okhttp3.Request;
import retrofit2.Call;
import retrofit2.CallAdapter;
import retrofit2.Callback;
import retrofit2.Response;
import retrofit2.Retrofit;
public class RetryCallAdapterFactory extends CallAdapter.Factory {
	public static RetryCallAdapterFactory create() {
		return new RetryCallAdapterFactory();
	}
	@Nullable
	@Override
	public CallAdapter<?, ?> get(@NonNull Type returnType, @NonNull Annotation[] annotations,
			@NonNull Retrofit retrofit) {

		int itShouldRetry = 0;
		final Retry retry = getRetry(annotations);
		if (retry != null) {
			itShouldRetry = retry.max();
		}
		return new RetryCallAdapter<>(
				retrofit.nextCallAdapter(this, returnType, annotations),
				itShouldRetry
				);
	}
	private Retry getRetry(@NonNull Annotation[] annotations) {
		for (Annotation annotation : annotations) {
			if (annotation instanceof Retry) {
				return (Retry) annotation;
			}
		}
		return null;
	}
	static final class RetryCallAdapter<R, T> implements CallAdapter<R, T> {
		private final CallAdapter<R, T> delegated;
		private final int maxRetries;
		public RetryCallAdapter(CallAdapter<R, T> delegated, int maxRetries) {
			this.delegated = delegated;
			this.maxRetries = maxRetries;
		}
		@Override
		public Type responseType() {
			return delegated.responseType();
		}
		@Override
		public T adapt(final Call<R> call) {
			return delegated.adapt(maxRetries > 0 ? new RetryingCall<>(call, maxRetries) : call);
		}
	}
	static final class RetryingCall<R> implements Call<R> {
		private final Call<R> delegated;
		private final int maxRetries;
		public RetryingCall(Call<R> delegated, int maxRetries) {
			this.delegated = delegated;
			this.maxRetries = maxRetries;
		}
		@Override
		public Response<R> execute() throws IOException {
			return delegated.execute();
		}
		@Override
		public void enqueue(@NonNull Callback<R> callback) {
			delegated.enqueue(new RetryCallback<>(callback, maxRetries));
		}
		@Override
		public boolean isExecuted() {
			return delegated.isExecuted();
		}
		@Override
		public void cancel() {
			delegated.cancel();
		}
		@Override
		public boolean isCanceled() {
			return delegated.isCanceled();
		}
		@Override
		public Call<R> clone() {
			return new RetryingCall<>(delegated.clone(), maxRetries);
		}
		@Override
		public Request request() {
			return delegated.request();
		}
	}
	static final class RetryCallback<T> implements Callback<T> {
		private final Callback<T> callback;
		private final int maxRetries;
		public RetryCallback(Callback<T> callback, int maxRetries) {
			this.callback = callback;
			this.maxRetries = maxRetries;
		}
		private final AtomicInteger retryCount = new AtomicInteger(0);
		@Override
		public void onResponse(@NonNull Call<T> call, @NonNull Response<T> response) {
			callback.onResponse(call, response);
		}
		@Override
		public void onFailure(@NonNull Call<T> call, @NonNull Throwable t) {
			if (retryCount.incrementAndGet() <= maxRetries) {
				retryCall(call);
			} else if (maxRetries > 0) {
				callback.onFailure(call,
						new TimeoutException(String.format("No retries left after %s attempts.", maxRetries)));
			} else {
				callback.onFailure(call, t);
			}
		}

		private void retryCall(Call<T> call) {	
			call.clone().enqueue(this);
		}
	}
}