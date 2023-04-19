package org.upgradeplatform.responsebeans;

public class Factor {

    private String level;
    private Payload payload;

    public Factor() {
        super();
    }


    public Factor(String level, Payload payload) {
        this.level = level;
        this.payload = payload;
    }

    public String getLevel() {
        return this.level;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public Payload getPayload() {
        return this.payload;
    }

    public void setPayload(Payload payload) {
        this.payload = payload;
    }

    @Override
    public String toString() {
        return "{" +
            " level='" + getLevel() + "'" +
            ", payload='" + getPayload() + "'" +
            "}";
    }
    
}
