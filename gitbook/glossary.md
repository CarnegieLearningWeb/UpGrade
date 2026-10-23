# Glossary

### App Context

The "app context" of an experiment is really the application within which that experiment takes place. We provide a structure for context metadata to be passed from environment variables.

### Archived

Experiment status that indicates a fully completed or closed experiment. Archived experiments cannot be modified or reactivated.

### Cancelled

Experiment status that is used to immediately terminate an enrolling experiment. Cancelled experiments cannot be edited or reactivated.

### Condition

Experiment conditions represent the different experiences randomly provided to users as part of the experiment. Every experiment should have at least 2 conditions. Conditions can have different weights, which represent the probability that a student will be assigned the condition.

### Consistency Rule

Experiment setting for handling assignment when a user encounters an experiment point prior to the enrollment schedule.

* **Individual consistency** prioritizes that the user be assigned the same experimental condition(s) regardless of whether they complete a unit multiple times, switch groups, etc. Example: if a user reaches the default condition prior to the enrollment schedule, that user will receive the default condition but other users in the group may receive a different condition.
* **Group consistency** prioritizes that the group be assigned the same experimental condition(s). Example: if one user reaches the default condition prior to the enrollment schedule, all other users in the group will be automatically assigned the default condition.
* **Experiment consistency** (may be deprecated in later releases of UpGrade) prioritizes experimental assignment regardless of when user(s) reach an experiment point in the workspace flow. Specifically it does not force a default condition on users who reach an experiment point prior to the enrollment schedule.

### Decision Point

Point in the software code that is able to check for the existence of an experiment and change behavior based on the student's condition. A decision point is made up of a **Site** and a **Target**. Both of these parameters are strings and can have any value. Site indicates a place in code (e.g. a function) while the target indicates the application component that will undergo the experiment (e.g. name of a software component, unique ID of a lesson, etc.)

Examples of Decision Points from Carnegie Learning's MATHia software:\
1\. Code that responds to user's click on Skillometer\
2\. Code that selects the next workspace for a user\
3\. Code that generates motivational messages

### Decision Point Site, Target

As noted in the Decision Point section, a Site and Target combination uniquely identifies a Decision Point. This may change in future releases of UpGrade if we support multiple experiments at a single decision point.

### Coordinated Decision Point

If one experiment has multiple decision points, they become coordinated decision points that share the condition assignment. In future versions of UpGrade, there may be differences for condition assignments across coordinated decision points. Coordinated Decision Points represent a portion of an experiment that can extends over sequential or otherwise coordinated content. In MATHia, this maps to workspaces (e.g. ws1→ws2), units, or other sequential MATHia objects. Non-sequential types of coordination in MATHia could refer to hint levels, or skillometer.

### Default

The experiment default is the software behavior or feature that is used for users who are not participating in the experiment. Non-participation might be due to a request to be excluded, encountering the experiment point before or after the experiment is active, etc. All experiments have a default. In many cases, the default experience may be identical to one of the experiment conditions, but it is also possible to define an experiment such that the default experience is not the same as any of the experimental conditions.

### Enrolling

Experiment status that indicates an experiment is scheduled and active, i.e. currently enrolling users.

### Enrollment Complete

Experiment status that indicates an experiment has enrolled enough participants for the design to be complete. To enforce consistency, participants may continue to experience the software behavior defined by their experimental condition. When experiments are in an Enrollment Complete state, the experimenter can restart Enrollment if desired.

### Ending Criteria

Specifications on how UpGrade should automatically change status to Enrollment Complete. Criteria can be be date/time, number of users, or user/group combination.

### Exclude If Reached

An option for each decision point, false by default. If true, excludes any users from the experiment if they reached the decision point during the period prior to the experiment creation, or when the experiment has been defined but is in an inactive state. Note that for this parameter to work, the `markExperimentPoint` code needs to exist at the decision point in the client application. One possible use case for this parameter could be if the experimenter expects the users to reach the decision point multiple times in their experience with the client app, and only wants users who never reached the decision point prior to experiment launch to be randomly assigned a condition.

### Exclusion

Excluded user semantics

1. Student reached experiment before enrollment begins
2. Student is on the explicit exclude list
3. Student's group is on the explicit exclude list
4. Group was excluded for some reason and student is in the group
5. Misc exclusions (to be eventually categorized)

### Experiment

A test in which students are randomly assigned to one of two or more conditions, each of which defines a particular software behavior or feature. Other terms we use to describe experiments: trial, A/B test, variant, fair comparison.

### GetAllExperimentConditions

API call that retrieves all available experiments and corresponding conditions

### Group

Unit of assignment setting. Typically refers to class, school, or district. Custom groups can be defined according to UpGrade developers' needs.

### Metrics

The key "metrics" contains a dictionary of metrics. Metrics can either be primitive values that apply to the student as a whole or they can be values nested in a group. Upgrade should assume that all metrics are optional (that is, any metrics can be omitted for any student). All metrics provided for a student are counted. Every metric should be calculated over all students who provide that metric. For example, if complete data is provided for 9 students but, for the 10th student, data is provided including all metrics except for totalTimeSeconds, then the mean for totalTimeSeconds should be calculated over 9 students, but means for all other metrics will be calculated over 10 students. You can add a single metrics as shown below:

### Metrics (Repeatable)

Repeatable metrics have the characteristic that they represent data about a subset of the student data. For example, there are repeatable metrics for each workspace in MATHia (each workspace contributes multiple metrics - including time to complete, number of problems completed, etc.). Repeatable metrics might represent completion of the same thing (e.g. the same workspace completed twice) or different things (different workspace completions).

### Payload

A "payload" is the actual string value that will be delivered to a decision point when /assign is called when a user is enrolled and assigned a condition. By default, this will be the name of the condition, such that if assigned the "control" condition, a user will receive the string "control" as the payload. But this can be updated to be a different value, such that users assigned to the "control" condition could receive a different string value to direct the application what to do, such as the name of a feature, a url, or even a JSON object.

### Post-Experiment Rule

Experiment setting for system behavior after an experiment has reached enrollment criteria (Enrollment Complete). The Post-Experiment Rule determines how UpGrade responds to users reaching the previously-defined experiment point.

* **Revert:** Users who reach an experiment decision point after EnrollmentComplete will be assigned the default behavior.
* **Continue**: Users who reach an experiment decision point after EnrollmentComplete will Continue to experience their assigned experimental condition. If we enforce Group Consistency, participants who reach the experiment decision point for the first time when the Enrollment is Complete will be assigned the condition of their group.

### Preview

Status that indicates the experiment is in a preview or demo state. In this state, the experimenter can simulate the experience of "dummy" users who have been manually assigned to a condition, and review the software behavior associated with that condition.

### Repeated Measures

If a metric is repeatable, then it might provide multiple values that represent the same value for a single user. For example, in MATHia, a user might complete a workspace multiple times and so have multiple values for a metric called "timeToCompleteWorkspace." The repeated measures treatment tells UpGrade how to use these multiple values. An experimenter might only care about the time for the first completion of the workspace or the last completion of the workspace - or an experimenter can choose to take the mean or median of the times.

### Roles

Roles in UpGrade are defined as follows.\
Admin: Can create, edit, and launch experiments, feature-flags, and segments. Can manage roles.\
Creator: Can create, edit, and launch experiments, feature-flags, and segments.\
User Manager: Can create and edit segments and preview users only, can view experiments and feature flags.\
Reader (default): Read-only access; can view but cannot make any changes.

### Unit of Assignment

Defines to whom experiments are assigned. UpGrade defines possible units of assignment and their behavior as follows.

* **Individual:** If unit of assignment is set to individual, users within the same group can receive different conditions of the experiment.
* **Group:** If unit of assignment is set to group, all students within a group are assigned to the same condition. Groups can be defined by the educational app to which UpGrade is connected, but the most common groups are:
  * Class
  * School
  * Teacher
  * District

<br>
