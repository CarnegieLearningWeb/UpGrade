package org.upgradeplatform.responsebeans;

public class Value {


	private Integer time;
	private String avg;
	private Integer problems;

	public Value() {}

	public Value(Integer time, String avg, Integer problems) {
		super();
		this.time = time;
		this.avg = avg;
		this.problems = problems;
	}

	public Integer getTime() {
		return time;
	}

	public void setTime(Integer time) {
		this.time = time;
	}

	public String getAvg() {
		return avg;
	}

	public void setAvg(String avg) {
		this.avg = avg;
	}

	public Integer getProblems() {
		return problems;
	}

	public void setProblems(Integer problems) {
		this.problems = problems;
	}


}
