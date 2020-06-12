package org.upgradeplatform.requestbeans;

import java.util.List;

public class MetricUnitBody {
	
	private List<MetricUnit>  metricUnit;
	
	public MetricUnitBody(List<MetricUnit>  metricUnit) {
		this.metricUnit = metricUnit;
	}
	
	public List<MetricUnit> getMetricUnit() {
		return metricUnit;
	}

	public void setMetricUnit(List<MetricUnit> metricUnit) {
		this.metricUnit = metricUnit;
	}
	

}
