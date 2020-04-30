package org.upgradeplatform.interfaces;


import org.eclipse.jdt.annotation.NonNull;
import org.upgradeplatform.responsebeans.ErrorResponse;

public interface ResponseCallback<T> {
	
	void onSuccess(@NonNull T t);
	void onError(@NonNull ErrorResponse error);

}
