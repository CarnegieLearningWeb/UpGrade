package org.upgradeplatform.interfaces;

public interface InvocationCallback<RESPONSE> {
    public void completed(RESPONSE response);
    public void failed(Throwable throwable);
}