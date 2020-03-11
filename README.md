# EES CLIENT SIDE SDK

# Functions

## init (userId, hostUrl, { group?, workingGroup? })
Create/Update user definition in the database

## setGroupMembership (group)
Updates/Set the group membership of the user received from init

## setWorkingGroup (workingGroup)
Updates/Set the working group of the user received from init

## getAllExperimentCondition()
Get all the experiment assignments for the user received from init

## interestedExperimentPoint (experimentPointAndPartitionId[])
Use this functions to store initialized user's interested experiment points.

## getExperimentCondition (experimentPoint, partitionId?)
Returns the Experiment Condition for the partition and point received from the getAllExperimentConditions for the user received from init

## markExperimentPoint (experimentPoint, partitionId?)
Calls markExperimentPoint for the partition and point. It will use the user definition from init call

## failedExperimentPoint(experimentName, experimentPoint?, reason?)
Use this function to report failure with given reason
