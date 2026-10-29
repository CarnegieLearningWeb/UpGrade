package org.upgradeplatform.requestbeans;

import org.upgradeplatform.utils.Utils.BinaryRewardValue;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Body of POST /reward. Identifies the experiment either by {@code experimentId} or by {@code context} +
 * {@code decisionPoint}; unset fields are omitted from the request. Also used for the request echo in
 * {@link org.upgradeplatform.responsebeans.SendRewardResponse}.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RewardRequest {
	private BinaryRewardValue rewardValue;
	private String experimentId;
	private String context;
	private DecisionPoint decisionPoint;

	public RewardRequest() {
	}

	public static RewardRequest forExperiment(BinaryRewardValue rewardValue, String experimentId) {
		RewardRequest request = new RewardRequest();
		request.rewardValue = rewardValue;
		request.experimentId = experimentId;
		return request;
	}

	public static RewardRequest forDecisionPoint(BinaryRewardValue rewardValue, String context, String site,
			String target) {
		RewardRequest request = new RewardRequest();
		request.rewardValue = rewardValue;
		request.context = context;
		request.decisionPoint = new DecisionPoint(site, target);
		return request;
	}

	public BinaryRewardValue getRewardValue() {
		return rewardValue;
	}

	public void setRewardValue(BinaryRewardValue rewardValue) {
		this.rewardValue = rewardValue;
	}

	public String getExperimentId() {
		return experimentId;
	}

	public void setExperimentId(String experimentId) {
		this.experimentId = experimentId;
	}

	public String getContext() {
		return context;
	}

	public void setContext(String context) {
		this.context = context;
	}

	public DecisionPoint getDecisionPoint() {
		return decisionPoint;
	}

	public void setDecisionPoint(DecisionPoint decisionPoint) {
		this.decisionPoint = decisionPoint;
	}

	@Override
	public String toString() {
		return "RewardRequest [rewardValue=" + rewardValue + ", experimentId=" + experimentId + ", context=" + context
				+ ", decisionPoint=" + decisionPoint + "]";
	}
}
