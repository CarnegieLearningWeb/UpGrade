# Experiment States and Pause Behavior

An experiment can be in one of five states: Inactive, Running, Paused, Stopped, and Archived.&#x20;

### Inactive

An experiment is Inactive when parameters are still being configured and/or when the experimenter has not yet elected to transition it to Running.&#x20;

Required parameters are:

* At least one Decision Point
* At least one Condition
* At least one Include List defined (or Include All selected)

When all required parameters of an experiment have been set, the Start button will be available. If a required parameter is deleted, the Start button will revert to grey. You can choose to start the experiment manually by clicking Start or schedule it to start at a future date.&#x20;

<div data-with-frame="true"><figure><img src="../.gitbook/assets/Screenshot 2026-01-26 at 3.51.47 PM.png" alt=""><figcaption></figcaption></figure></div>

### Running

After clicking Start, the experiment is Running. When running, it is collecting enrollment data from participants such as number of enrollments, as well as metrics data, if metrics have been defined in the experiment. All new eligible participants will be enrolled in the experiment. Decision points and conditions cannot be edited while the experiment is running.&#x20;

<div data-with-frame="true"><figure><img src="../.gitbook/assets/image (46).png" alt=""><figcaption></figcaption></figure></div>

While running, an experiment can be transitioned to either Paused or Stopped.

<div data-with-frame="true"><figure><img src="../.gitbook/assets/image (48).png" alt=""><figcaption></figcaption></figure></div>

### Paused

A Paused experiment is temporarily stopped. New eligible participants will not be enrolled, but the experiment is still collecting data on existing enrollments. When selecting Pause, you have the opportunity to determine how the experiment should behave in terms of condition assignment while in the Paused state.&#x20;

* **Keep conditions**: Existing participants will received the same condition they were initially assigned. If a participant was assigned Condition A when the experiment was running, they will continue to receive Condition A while the experiment is paused.
* **No condition**: Existing participants will receive no condition assignment — in other words, their experience will revert to the default experience while the experiment ia paused.&#x20;
* **Assign (specific) condition**:  Existing participants will be assigned a specific condition while the experiment is paused. A use case for this may be if one condition is demonstrating a particularly compelling outcome, so the experimenter wants existing enrolled participants to be assigned the "winning" experience during the paused state.&#x20;

<div data-with-frame="true"><figure><img src="../.gitbook/assets/image (50).png" alt=""><figcaption></figcaption></figure></div>

While paused, the experiment can either Resume to the running state or be Stopped. Resuming the experiment reverts condition assignments back to how they were originally defined in the experiment.&#x20;

<div data-with-frame="true"><figure><img src="../.gitbook/assets/image (51).png" alt=""><figcaption></figcaption></figure></div>

### Stopped

When Stopped, the experiment is in a terminal state. The experiment is now read-only, although data and design can be exported, or the experiment can be duplicated (which sets the duplicate to Inactive). While Stopped, there are no new enrollments, no data is collected on existing enrollments, and there is no "stopped behavior" like the pause behavior.&#x20;

<div data-with-frame="true"><figure><img src="../.gitbook/assets/image (52).png" alt=""><figcaption></figcaption></figure></div>

### Archived

You can only Archive an experiment after it has been Stopped. The Archive option is in the 3 dot menu in the top right of the experiment. Archiving the experiment hides the experiment from the main UpGrade UI, and it can only be viewed by filtering on Archived status in the search bar. The data and design are visible for Archived experiments, and they can both be exported. Like Stopped experiments, Archived experiments can be duplicated, and the duplicate will be visible in the main UpGrade UI. Metrics for Archived experiments are "frozen" to what they were when the experiment was stopped.&#x20;

<div data-with-frame="true"><figure><img src="../.gitbook/assets/image (54).png" alt=""><figcaption></figcaption></figure></div>

