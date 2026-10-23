# Class: UpgradeClient

UpgradeClient.UpgradeClient

UpGradeClient is the main class for interacting with the UpGrade API.

**`Example`**

```typescript
import UpgradeClient from 'upgrade_client_lib/dist/browser';
```

```typescript
import UpgradeClient from 'upgrade_client_lib/dist/node';
```

General UpGrade types can also be accessed as named exports:

```typescript
import UpgradeClient, { IExperimentAssignment } from 'upgrade_client_lib/dist/browser';
```

SDK-Specific types can be accessed also:

```typescript
import { Interfaces } from 'upgrade_client_lib/dist/clientlibs/js/src/identifiers';

const initResponse: Interfaces.IUser = await upgradeClient.init();
```

## Table of contents

### Constructors

* constructor

### Methods

* getAllExperimentConditions
* getDecisionPointAssignment
* init
* log
* logCaliper
* markExperimentPoint
* setAltUserIds
* setGroupMembership
* setWorkingGroup

## Constructors

### constructor

• **new UpgradeClient**(`userId`, `hostUrl`, `context`, `options?`)

When constructing UpgradeClient, the user id, api host url, and "context" identifier are required. These will be attached to various API calls for this instance of the client.

**`Example`**

```typescript
// required
const hostUrl: "htts://my-hosted-upgrade-api.com";
const userId: "abc123";
const context: "my-app-context-name";

// not required, each is also optional
const options: {
  token: "someToken";
  clientSessionId: "someSessionId";
}

const upgradeClient: UpgradeClient[] = new UpgradeClient(hostURL, userId, context);
const upgradeClient: UpgradeClient[] = new UpgradeClient(hostURL, userId, context, options);
```

#### Parameters

| Name                       | Type     |
| -------------------------- | -------- |
| `userId`                   | `string` |
| `hostUrl`                  | `string` |
| `context`                  | `string` |
| `options?`                 | `Object` |
| `options.clientSessionId?` | `string` |
| `options.token?`           | `string` |

#### Defined in

[UpgradeClient.ts:99](https://github.com/CarnegieLearningWeb/UpGrade/blob/01c083e7/clientlibs/js/src/UpgradeClient.ts#L99)

## Methods

### getAllExperimentConditions

▸ **getAllExperimentConditions**(): `Promise`<`IExperimentAssignmentv5`\[]>

Will return all the experiment conditions for the user. Internally this uses the `context` and `userId` to query conditions for all eligible decision points at enrolling experiments for this user.

**`Example`**

```typescript
const allExperimentConditionsResponse: IExperimentAssignmentv5[] = await upgradeClient.getAllExperimentConditions(workingGroup);
```

#### Returns

`Promise`<`IExperimentAssignmentv5`\[]>

#### Defined in

[UpgradeClient.ts:237](https://github.com/CarnegieLearningWeb/UpGrade/blob/01c083e7/clientlibs/js/src/UpgradeClient.ts#L237)

***

### getDecisionPointAssignment

▸ **getDecisionPointAssignment**(`site`, `target?`): `Promise`<`Assignment`>

Given a site and optional target, return the condition assignment at this decision point NOTE: If getAllExperimentConditions() has not been called, this will call it first. NOTE ALSO: If getAllExperimentConditions() has been called, this will return the cached result and not make a network call.

**`Example`**

```typescript
const allExperimentConditionsResponse: IExperimentAssignmentv5[] = await upgradeClient.getDecisionPointAssignment(workingGroup);
```

#### Parameters

| Name      | Type     |
| --------- | -------- |
| `site`    | `string` |
| `target?` | `string` |

#### Returns

`Promise`<`Assignment`>

#### Defined in

[UpgradeClient.ts:263](https://github.com/CarnegieLearningWeb/UpGrade/blob/01c083e7/clientlibs/js/src/UpgradeClient.ts#L263)

***

### init

▸ **init**(`group?`, `workingGroup?`): `Promise`<`IUser`>

This will initialize user and metadata for the user. It will return the user object with id, group, and working group. NOTE: A user must be initialized at least once before calling any other methods. Else, you will see "Experiment user not defined" errors when other SDK methods are called.

**`Example`**

```typescript
const group: Record<string, Array<string>> = {
  classId: ['class1', 'class2'],
  districtId: ['district1', 'district2'],
}

const workingGroup: Record<string, string> = {
 classId: 'class1',
 districtId: 'district2',
}

const initResponse: Interfaces.IUser[] = await upgradeClient.init();
const initResponse: Interfaces.IUser[] = await upgradeClient.init(group);
const initResponse: Interfaces.IUser[] = await upgradeClient.init(group, workingGroup);

```

#### Parameters

| Name            | Type                            |
| --------------- | ------------------------------- |
| `group?`        | `Record`<`string`, `string`\[]> |
| `workingGroup?` | `Record`<`string`, `string`>    |

#### Returns

`Promise`<`IUser`>

#### Defined in

[UpgradeClient.ts:157](https://github.com/CarnegieLearningWeb/UpGrade/blob/01c083e7/clientlibs/js/src/UpgradeClient.ts#L157)

***

### log

▸ **log**(`value`, `sendAsAnalytics?`): `Promise`<`ILog`\[]>

Will report user outcome metrics to Upgrade. Please see https://upgrade-platform.gitbook.io/docs/developer-guide/reference/metrics for more information.

**`Example`**

```ts
const metrics: IMetricInput[] = [
    {
        "metric": "totalTimeSeconds",
        "datatype": "continuous"
    },
    {
        "metric": "completedAll",
        "datatype": "categorical",
        "allowedValues": [ "COMPLETE", "INCOMPLETE" ]
    },
    {
        "groupClass": "quizzes",
        "allowedKeys":
            [
                "quiz1",
                "quiz2",
                "quiz3"
            ],
        "attributes": 
            [
                {
                    "metric": "quizTimeSeconds",
                    "datatype": "continuous"
                },
                {
                    "metric": "score",
                    "datatype": "continuous"
                },
                {
                    "metric": "passStatus",
                    "datatype": "categorical",
                    "allowedValues": [ "PASS", "FAIL" ]
                }
            ]
     },
     {
         "groupClass": "polls",
         "allowedKeys":
             [
                 "poll1",
                 "poll2"
             ],
         "attributes": 
             [
                 {
                     "metric": "pollTimeSeconds",
                     "datatype": "continuous"
                 },
                 {
                     "metric": "rank",
                     "datatype": "categorical",
                     "allowedValues": [ "UNHAPPY", "NEUTRAL", "HAPPY" ]
                 }
             ]
       }
  ];

const logResponse: ILog[] = await upgradeClient.metrics(metrics);
```

#### Parameters

| Name              | Type           | Default value |
| ----------------- | -------------- | ------------- |
| `value`           | `ILogInput`\[] | `undefined`   |
| `sendAsAnalytics` | `boolean`      | `false`       |

#### Returns

`Promise`<`ILog`\[]>

#### Defined in

[UpgradeClient.ts:414](https://github.com/CarnegieLearningWeb/UpGrade/blob/01c083e7/clientlibs/js/src/UpgradeClient.ts#L414)

***

### logCaliper

▸ **logCaliper**(`value`, `sendAsAnalytics?`): `Promise`<`ILog`\[]>

Will report Caliper user outcome metrics to Upgrade, same as log() but with Caliper envelope.

**`Example`**

```ts
const logRequest: CaliperEnvelope = {
     sensor: 'test',
     sendTime: 'test',
     dataVersion: 'test',
     data: [],
   };

 const logCaliperResponse: ILog[] = await upgradeClient.logCaliper(logRequest);

```

#### Parameters

| Name              | Type              | Default value |
| ----------------- | ----------------- | ------------- |
| `value`           | `CaliperEnvelope` | `undefined`   |
| `sendAsAnalytics` | `boolean`         | `false`       |

#### Returns

`Promise`<`ILog`\[]>

#### Defined in

[UpgradeClient.ts:436](https://github.com/CarnegieLearningWeb/UpGrade/blob/01c083e7/clientlibs/js/src/UpgradeClient.ts#L436)

***

### markExperimentPoint

▸ **markExperimentPoint**(`site`, `condition?`, `status`, `target?`, `uniquifier?`,`clientError?`): `Promise`<`IMarkExperimentPoint`>

Will record ("mark") that a user has "seen" a decision point.

Marking the decision point will record the user's condition assignment and the time of the decision point, regardless of whether the user is enrolled in an experiment.

`status` signifies a client application's note on what it did in the code with condition assignment that Upgrade provided. Status can be one of the following:

```ts
export enum MARKED_DECISION_POINT_STATUS {
  CONDITION_APPLIED = 'condition applied',
  CONDITION_FAILED_TO_APPLY = 'condition not applied',
  NO_CONDITION_ASSIGNED = 'no condition assigned',
}
```

The client can also send along an additional `clientError` string to log context as to why a condition was not applied.

**`Example`**

```ts
import { MARKED_DECISION_POINT_STATUS } from 'upgrade_types';

const site = 'dashboard';
const condition = 'variant_x'; // send null if no condition / no experiment is running / error
const status: MARKED_DECISION_POINT_STATUS = MARKED_DECISION_POINT_STATUS.CONDITION_FAILED_TO_APPLY
const target = 'experimental button'; // optional
const clientError = 'variant not recognized'; //optional

const allExperimentConditionsResponse: IExperimentAssignmentv4[] = await upgradeClient.markExperimentPoint(site, condition, MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED, target, clientError);
```

#### Parameters

| Name           | Type                           | Default value |
| -------------- | ------------------------------ | ------------- |
| `site`         | `string`                       | `undefined`   |
| `condition`    | `string`                       | `null`        |
| `status`       | `MARKED_DECISION_POINT_STATUS` | `undefined`   |
| `target?`      | `string`                       | `undefined`   |
| `uniquifier?`  | `string`                       | `undefined`   |
| `clientError?` | `string`                       | `undefined`   |

#### Returns

`Promise`<`IMarkExperimentPoint`>

#### Defined in

[UpgradeClient.ts:303](https://github.com/CarnegieLearningWeb/UpGrade/blob/01c083e7/clientlibs/js/src/UpgradeClient.ts#L303)

***

### setAltUserIds

▸ **setAltUserIds**(`altUserIds`): `Promise`<`IExperimentUserAliases`\[]>

Will set an array of alternate user ids for the user.

**`Example`**

```ts
const aliases: string[] = ['alias1', 'alias2'];

const setAltUserIdsResponse: IExperimentUserAliases[] = await upgradeClient.setAltUserIds(aliases);
```

#### Parameters

| Name         | Type        |
| ------------ | ----------- |
| `altUserIds` | `string`\[] |

#### Returns

`Promise`<`IExperimentUserAliases`\[]>

#### Defined in

[UpgradeClient.ts:451](https://github.com/CarnegieLearningWeb/UpGrade/blob/01c083e7/clientlibs/js/src/UpgradeClient.ts#L451)

***

### setGroupMembership

▸ **setGroupMembership**(`group`): `Promise`<`IUser`>

Will set the group membership(s) for the user and return the user object with updated working group.

**`Example`**

```typescript
const group: Record<string, Array<string>> = {
  classId: ['class1', 'class2'],
  districtId: ['district1', 'district2'],
}

const groupMembershipResponse: Interfaces.IUser[] = await upgradeClient.setGroupMembership(group);
```

#### Parameters

| Name    | Type                            |
| ------- | ------------------------------- |
| `group` | `Record`<`string`, `string`\[]> |

#### Returns

`Promise`<`IUser`>

#### Defined in

[UpgradeClient.ts:175](https://github.com/CarnegieLearningWeb/UpGrade/blob/01c083e7/clientlibs/js/src/UpgradeClient.ts#L175)

***

### setWorkingGroup

▸ **setWorkingGroup**(`workingGroup`): `Promise`<`IUser`>

Will set the working group(s) for the user and return the user object with updated working group.

**`Example`**

```typescript
const workingGroup: Record<string, string> = {
 classId: 'class1',
 districtId: 'district2',
}

const workingGroupResponse: Interfaces.IUser[] = await upgradeClient.setWorkingGroup(workingGroup);
```

#### Parameters

| Name           | Type                         |
| -------------- | ---------------------------- |
| `workingGroup` | `Record`<`string`, `string`> |

#### Returns

`Promise`<`IUser`>

#### Defined in

[UpgradeClient.ts:208](https://github.com/CarnegieLearningWeb/UpGrade/blob/01c083e7/clientlibs/js/src/UpgradeClient.ts#L208)
