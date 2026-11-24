# Unit of Assignment

## Individual Assignment

<div data-with-frame="true"><figure><img src="../.gitbook/assets/Screenshot 2026-01-26 at 3.23.58 PM (1).png" alt=""><figcaption></figcaption></figure></div>

When selecting individual assignment, each included participant will be randomly assigned a condition.

## Group Assignment

<div data-with-frame="true"><figure><img src="../.gitbook/assets/Screenshot 2026-01-26 at 3.23.22 PM.png" alt=""><figcaption></figcaption></figure></div>

Group assignment references one or more of the group types that have been previously defined in the [Context Metadata](../developer-guide/reference/context-metadata.md). For the selected group type, each group will be randomly assigned a condition, and each participant in a group will receive the same condition as the rest of the group.

## Within-Subjects Assignment

<div data-with-frame="true"><figure><img src="../.gitbook/assets/Screenshot 2026-01-26 at 3.26.40 PM.png" alt=""><figcaption></figcaption></figure></div>

In within-subjects assignment, every time a participant visits a decision point (and `/markExperimentPoint` is called), the participant is eligible to receive a new condition. There are different options for determining the order of such conditions for within-subjects experiments. Random will randomly select a condition each time the decision point has been marked. Random Round Robin will randomly order the experiment conditions, and when it runs out of conditions, will create a new random ordering. Ordered Round Robin will deliver the same sequence of conditions over and over again.
