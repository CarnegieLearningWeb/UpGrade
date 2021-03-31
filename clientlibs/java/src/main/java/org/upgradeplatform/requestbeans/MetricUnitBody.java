package org.upgradeplatform.requestbeans;

import java.util.List;

public  class MetricUnitBody<T> {
	
	private List<T>  metricUnit;
	
	public MetricUnitBody(List<T>  metricUnit) {
		this.metricUnit = metricUnit;
	}
	
	public List<T> getMetricUnit() {
		return metricUnit;
	}

	public void setMetricUnit(List<T> metricUnit) {
		this.metricUnit = metricUnit;
	}
	

}
