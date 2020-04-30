package org.upgradeplatform.utils;


import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;


public class ServiceGenerator {

	static Retrofit.Builder builder = new Retrofit.Builder()
			.addConverterFactory(GsonConverterFactory.create())
			.addCallAdapterFactory(RetryCallAdapterFactory.create());

	static Retrofit retrofit;
	
	private static HttpLoggingInterceptor loggingInterceptor = new HttpLoggingInterceptor().setLevel(HttpLoggingInterceptor.Level.NONE);
	private static OkHttpClient.Builder httpClientBuilder = new OkHttpClient.Builder();

	public static <S> S createService(Class<S> serviceClass, String baseUrl) {
		
		builder.baseUrl(baseUrl);
		retrofit = builder.build();
		
		if(!httpClientBuilder.interceptors().contains(loggingInterceptor)) {
			httpClientBuilder.addInterceptor(loggingInterceptor);
			builder = builder.client(httpClientBuilder.build());
			
			retrofit = builder.build();
		}

		return retrofit.create(serviceClass);
	}
}
