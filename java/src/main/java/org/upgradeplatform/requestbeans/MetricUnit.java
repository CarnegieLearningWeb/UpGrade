package org.upgradeplatform.requestbeans;
import static org.upgradeplatform.utils.Utils.*;


public class MetricUnit {
	
	private Object key;
	private MetricUnit[] children;
	private Metadata metadata;
	private String[] allowedData;

	public MetricUnit(Object key, MetricUnit[] children, String metadataType, String[] allowedData) {
		super();
		
		if (!isValidMetricMetaDataString(metadataType)) {
			throw new IllegalArgumentException(INVALID_METRIC_META_DATA);
		}
		
		this.key = key;
		this.children = children;
		this.metadata = new Metadata(metadataType);
		this.allowedData = allowedData;
	}
	
	public Object getKey() {
		return key;
	}
	public void setKey(Object key) {
		this.key = key;
	}
	public MetricUnit[] getChildren() {
		return children;
	}
	public void setChildren(MetricUnit[] children) {
		this.children = children;
	}
	public Metadata getMetadata() {
		return metadata;
	}
	public void setMetadata(Metadata metadata) {
		this.metadata = metadata;
	}
	public String[] getAllowedData() {
		return allowedData;
	}
	public void setAllowedData(String[] allowedData) {
		this.allowedData = allowedData;
	}
}
