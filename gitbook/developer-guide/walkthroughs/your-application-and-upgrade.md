# Your Application and UpGrade

Once you've created an instance of UpGrade, you need to make a few changes to your educational app. The three key APIs are `/init`, `/assign`, and `/mark`. The details of these and other APIs are outlined in the CLIENT SDK section.

## **Initialize your users**

Each user that accesses your application could be eligible for an experiment. In order to properly register them to an experiment, you need to initialize the user and assign any group memberships, if you're using group consistency. The first call from your application to UpGrade should be a call to [`/init`](../reference/api-documentation.md#init). You can also set the group membership and working group at this point, although users can still be assigned conditions without any groups.

Perhaps you don't know each user's groups until later. You can use the [`/groupmembership`](../reference/api-documentation.md#groupmembership) API to specifically assign a list of groups to a user. These groups are defined in the [Context Metadata](../reference/context-metadata.md). A user can belong to multiple groups. For example, a student can be assigned to multiple classes and multiple teachers.

A user's working group is the current active group. Perhaps your application works with multiple subjects, but a student is currently working on math. You would use [`/workinggroup`](../reference/api-documentation.md#workinggroup) to set math as the student's active group. Working groups are important, because UpGrade's group assignment and exclusion is based on a user's working group.

Perhaps your users have different IDs in multiple applications but you want to link them all together. You should use the `/useraliases` API to set the alias and associate it with the original ID. You can collect assignments for this user from any of the aliases.

## **Collect assignments**

A decision point is made up of a site and target. A site may have multiple targets. Think of the site as a place in the code (e.g., a function name) where the condition will be assigned. A category of locations within the app. The target indicates the app component (e.g., a problem ID) that will undergo the experiment. A specific element within the category.

For example, if one page of your application is a site, then the targets could be the hint button, the written content on the page, or the glossary in the corner. At different points in your application, you can check for a condition by filtering for site and target. The hint button on this page will only look for conditions related to the hint button and the written content on this page will only check for conditions relating to the content.

When a user has reached a spot in your application where you would like to run an experiment and change the user experience, use the [`/assign`](../reference/api-documentation.md#assign) API to collect any experiment conditions. The assign call will return an assigned condition for _every_ enrolling experiment that includes the user under the specified context. You can then filter the condition list by site and/or target. We suggest you cache the result if a user is eligible for multiple decision points under one context.

A user will receive the same set of conditions each time. That is, the random assignment will not give a user a different condition after one has been assigned.

## **Mark a decision point**

When a user reaches a specific decision point and receives a condition, you want to mark that decision point. UpGrade needs to know that this user is enrolled in this experiment and has received an intervention. You could mark the decision point after a user has experienced the intervention, but we suggest marking at the start. You want to register that a user has seen the intervention, not only that a user has completed the intervention. See the [Metrics](../reference/metrics.md) page for ideas on how to register completion.

Use the [`/mark`](../reference/api-documentation.md#mark) API to tell UpGrade the site, target, condition, and if that condition was successfully applied to a user. UpGrade will also keep track of excluded users for whom the condition failed to apply, were excluded based on group consistency, or had previously reached the decision point before the experiment was enrolling.

## **Log metrics**

After a user marks a decision point, the corresponding experiment will start collecting data on that user. The [Metrics](../reference/metrics.md) page has more detailed information on what metrics UpGrade collects and how to customize your data. It's important to note that metric data will not be calculated until after a user marks a decision point.

Follow this order for a successful integration with UpGrade!
