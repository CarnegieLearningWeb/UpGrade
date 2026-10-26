---
description: Adaptive condition assignment using Thompson Sampling
---

# Thompson Sampling (Configurable)

### Summary

Thompson Sampling is an "adaptive" experiment type where the condition distribution will update depending on user feedback. "Winning" conditions that accumulate substantively more successes (and fewer failures) than other conditions will see their distribution % go up, and "losing" conditions will trend downward, with the idea that a clear winner will eventually trend toward 100%.

### Parameters

There are 3 editable parameters when creating a Thompson Sampling experiment, plus a prior for each condition:<br>

<figure><img src="../.gitbook/assets/image (2).png" alt=""><figcaption></figcaption></figure>

{% hint style="info" %}
FYI: These values CAN be changed while the experiment is running or paused. They become read-only once the experiment is completed or archived.
{% endhint %}

`batchSize` — "Batch Size": integer (default: 1, min: 1, max: 1,000,000)\
\
How many rewards to collect before updating the model.\
\
For example, a batch size of 1 will result in the model being updated after every reward is collected. A batch size of 100 will wait until 100 rewards have been collected before adjusting the weights, and then again after another 100, and so on...\
\
The count is experiment-wide, not per condition: 60 rewards on one condition and 40 on another will close a batch of 100 together, and every condition's buffered rewards are folded in at that point.\
\
Ideally for Thompson Sampling, data should be updated after every piece of feedback comes in. However, batching could be valuable for performance if there is a lot of traffic, for instance.

`warmupThreshold` — "Warmup Threshold": integer (default: 0, min: 0, max: 1,000,000)\
\
A "burn-in" period. While the total number of rewards received is at or below this threshold, conditions are assigned uniformly at random rather than by sampling, so every arm gathers evidence on equal footing. Once the threshold is passed, assignment switches to Thompson Sampling and the model updates after every `batchSize` rewards.\
\
A value of 0 disables warmup entirely.\
\
Note that this counts **rewards received, not users assigned** — the posteriors only move when rewards arrive, so reward volume is the meaningful measure of how much evidence has actually accumulated. Rewards still sitting in an unflushed batch count toward the threshold.

`minimumDrawDifference` — "Minimum Draw Difference": float (default: 0.0, min: 0.0, max: 1.0)\
\
Controls when the system considers one condition to be meaningfully better than another based on their posterior reward distributions.\
\
On each assignment, one value is drawn from every condition's Beta distribution and the highest draw wins. If the gap between the **top two** draws is smaller than this value, the result is treated as too close to call and a condition is picked uniformly at random instead.\
\
A value of 0.0 disables the check, so the highest draw always wins. Larger values widen the margin a condition must win by, which sprinkles in more equal-weighted random draws whenever conditions are producing similar results.\
\
The theory is that because of variance in small sample sizes, Thompson Sampling results could prematurely crown a winner without a fair fight; when given enough input it should correct eventually, but studies may not have the luxury of a huge pool of participants. Allowing for some chance of the losing condition to get some extra shots to gather more data by giving it a coin-toss here and there instead of a 1% chance.<br>

#### Priors

<figure><img src="../.gitbook/assets/image (1).png" alt=""><figcaption></figcaption></figure>

Each condition carries a Beta prior, expressed as a prior success count and a prior failure count: integers with a minimum of 1, defaulting to 1 and 1.\
\
These seed the distribution before any real feedback arrives. A condition's posterior is `Beta(priorSuccess + successes, priorFailure + failures)`, so larger priors make the model slower to move away from its starting assumption, while the default of 1 and 1 is an even, uninformative starting point.\
\
Priors are edited per condition, separately from the three parameters above.

<br>

#### Reward Feedback

<figure><img src="../.gitbook/assets/image (3).png" alt=""><figcaption></figcaption></figure>

Rewards are binary — either `SUCCESS` or `FAILURE` — and are reported to the `/v6/reward` endpoint. Each reward is attributed to the condition the user was actually assigned, and updates that condition's success or failure count, which in turn shifts its posterior distribution for subsequent assignments.
