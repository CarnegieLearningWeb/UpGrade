package org.upgradeplatform.responsebeans;

import org.upgradeplatform.utils.Utils.PayloadType;

public class Payload {

    private PayloadType type;
    private String value;

    public Payload(){
        super();
    }

    public Payload(PayloadType type, String value){
        this.type = type;
        this.value = value;
    }

    public PayloadType getType() {
        return this.type;
    }

    public void setType(PayloadType type) {
        this.type = type;
    }

    /** {@see Condition#getConditionCode()} */
    public String getValue() {
        return this.value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    @Override
    public String toString() {
        return "{" +
            " type='" + getType() + "'" +
            ", value='" + getValue() + "'" +
            "}";
    }
    
}
