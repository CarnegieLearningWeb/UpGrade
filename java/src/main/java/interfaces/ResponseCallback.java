package interfaces;


import org.eclipse.jdt.annotation.NonNull;

import okhttp3.ResponseBody;

public interface ResponseCallback<T> {
	
	void onSuccess(@NonNull T t);
	void validationError(@NonNull String t);
	void onError(@NonNull ResponseBody responseBody);


}
