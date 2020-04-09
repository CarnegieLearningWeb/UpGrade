package interfaces;


import org.eclipse.jdt.annotation.NonNull;

import okhttp3.ResponseBody;
import responsebeans.ErrorResponse;

public interface ResponseCallback<T> {
	
	void onSuccess(@NonNull T t);
	void onError(@NonNull ErrorResponse error);

}
