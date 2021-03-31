package org.upgradeplatform.requestbeans;

import org.upgradeplatform.utils.Utils.MetricMetaData;

public class SingleMetric {
	
	private String  metric;
	private MetricMetaData datatype;
	private Object[] allowedValues; // Can be String or number
	
	public SingleMetric(String metric, MetricMetaData datatype) {
		super();
		this.metric = metric;
		this.datatype = datatype;
	}
	
	public SingleMetric(String metric, MetricMetaData datatype, Object[] allowedValues) {
		super();
		this.metric = metric;
		this.datatype = datatype;
		this.allowedValues = allowedValues;
	}

	public String getMetric() {
		return metric;
	}

	public void setMetric(String metric) {
		this.metric = metric;
	}

	public MetricMetaData getDatatype() {
		return datatype;
	}

	public void setDatatype(MetricMetaData datatype) {
		this.datatype = datatype;
	}

	public Object[] getAllowedValues() {
		return allowedValues;
	}

	public void setAllowedValues(Object[] allowedValues) {
		this.allowedValues = allowedValues;
	}
	
}
