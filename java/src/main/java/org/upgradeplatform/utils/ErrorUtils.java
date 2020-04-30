package org.upgradeplatform.utils;

import java.io.IOException;
import java.lang.annotation.Annotation;

import org.upgradeplatform.responsebeans.ErrorResponse;

import okhttp3.ResponseBody;
import retrofit2.Converter;
import retrofit2.Response;


public class ErrorUtils {

    public static ErrorResponse parseError(Response<?> response) {
    	
        Converter<ResponseBody, ErrorResponse> converter = 
                ServiceGenerator.retrofit.responseBodyConverter(ErrorResponse.class, new Annotation[0]);

        try (ResponseBody body = response.errorBody()) {
            return converter.convert(body);
        } catch (IOException e) {
            return new ErrorResponse(e.toString());
        }
    }
}