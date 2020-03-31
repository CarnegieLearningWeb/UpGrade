# educational-experiment-service-java-client-libs

# Functions

## InitUser
This is the first call from the client lib. It will create the user definition on the server and set up the endpoint to call for the client end.


To Initialize user with userId and hostUrl( The URL of the experiment service server.)
> init( String userId,  String hostUrl , callback)

To Initialize user with userId and hostUrl and student group definition
> init( String userId,  String hostUrl , HashMap<String, ArrayList<String>> group, callback)

To Initialize user with userId and hostUrl student group definition and student workingGroup definition
> init( String userId,  String hostUrl , HashMap<String, ArrayList<String>> group,    HashMap<String, String> workingGroup, callback)


## SetGroupMemebership
To Update/Set the group membership of the user received from init
> setGroupMembership( String userId,  HashMap<String, ArrayList<String>> group, callback)


## setWorkingGroup (workingGroup)
> setWorkingGroup( String userId, HashMap<String, String> workingGroup, callback)

## getAllExperimentCondition
Get all the experiment assignments for the user received from init
> getAllExperimentCondition(String context, callback)

## getExperimentCondition 
Returns the Experiment Condition for the partition and point received from the getAllExperimentConditions for the user received from init

> getExperimentCondition(String userId, String experimentPoint, callback)

> getExperimentCondition(String userId, String experimentPoint,  String experimentId, callback)

## markExperimentPoint 
Calls markExperimentPoint for the partition and point. It will use the user definition from init call

> markExperimentPoint( String userId, String experimentPoint, callback)

> markExperimentPoint( String userId, String experimentPoint, String experimentId, callback)

## failedExperimentPoint
Use this function to report failure with given reason
> failedExperimentPoint(String experimentPoint, callback)

> failedExperimentPoint(String experimentPoint, String experimentId, callback)

> failedExperimentPoint(String experimentPoint, String experimentId, String reason, callback)


# Example Init request

```java
  
  public static void main (String []args){
      ExperimentClient experimentClient = new ExperimentClient();

      String userId = "user1";
      String hostUrl = "http://ees-service-server.com/";

      experimentClient.initUser(userId,  hostUrl, new ResponseCallback<InitRequest>() {
          @Override
          public void onSuccess(@NonNull InitRequest arg0) {

          }

          @Override
          public void onError(@NonNull ResponseBody arg0) {

          }

          @Override
          public void validationError(@NonNull String arg0) {

          }
      });
    }
```

