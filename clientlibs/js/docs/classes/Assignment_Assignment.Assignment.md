# Class: Assignment

[Assignment/Assignment](../modules/Assignment_Assignment.md).Assignment

## Table of contents

### Constructors

- [constructor](Assignment_Assignment.Assignment.md#constructor)

### Accessors

- [factors](Assignment_Assignment.Assignment.md#factors)

### Methods

- [getCondition](Assignment_Assignment.Assignment.md#getcondition)
- [getExperimentType](Assignment_Assignment.Assignment.md#getexperimenttype)
- [getFactorLevel](Assignment_Assignment.Assignment.md#getfactorlevel)
- [getFactorPayload](Assignment_Assignment.Assignment.md#getfactorpayload)
- [getPayload](Assignment_Assignment.Assignment.md#getpayload)
- [markDecisionPoint](Assignment_Assignment.Assignment.md#markdecisionpoint)

## Constructors

### constructor

• **new Assignment**(`«destructured»`, `apiService`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `IExperimentAssignmentv5` |
| `apiService` | `default` |

#### Defined in

[Assignment/Assignment.ts:20](https://github.com/CarnegieLearningWeb/UpGrade/blob/dfb995baf/clientlibs/js/src/Assignment/Assignment.ts#L20)

## Accessors

### factors

• `get` **factors**(): `string`[]

#### Returns

`string`[]

#### Defined in

[Assignment/Assignment.ts:47](https://github.com/CarnegieLearningWeb/UpGrade/blob/dfb995baf/clientlibs/js/src/Assignment/Assignment.ts#L47)

## Methods

### getCondition

▸ **getCondition**(): `string`

#### Returns

`string`

#### Defined in

[Assignment/Assignment.ts:35](https://github.com/CarnegieLearningWeb/UpGrade/blob/dfb995baf/clientlibs/js/src/Assignment/Assignment.ts#L35)

___

### getExperimentType

▸ **getExperimentType**(): `EXPERIMENT_TYPE`

#### Returns

`EXPERIMENT_TYPE`

#### Defined in

[Assignment/Assignment.ts:43](https://github.com/CarnegieLearningWeb/UpGrade/blob/dfb995baf/clientlibs/js/src/Assignment/Assignment.ts#L43)

___

### getFactorLevel

▸ **getFactorLevel**(`factor`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `factor` | `string` |

#### Returns

`string`

#### Defined in

[Assignment/Assignment.ts:51](https://github.com/CarnegieLearningWeb/UpGrade/blob/dfb995baf/clientlibs/js/src/Assignment/Assignment.ts#L51)

___

### getFactorPayload

▸ **getFactorPayload**(`factor`): `IPayload`

#### Parameters

| Name | Type |
| :------ | :------ |
| `factor` | `string` |

#### Returns

`IPayload`

#### Defined in

[Assignment/Assignment.ts:59](https://github.com/CarnegieLearningWeb/UpGrade/blob/dfb995baf/clientlibs/js/src/Assignment/Assignment.ts#L59)

___

### getPayload

▸ **getPayload**(): `IPayload`

#### Returns

`IPayload`

#### Defined in

[Assignment/Assignment.ts:39](https://github.com/CarnegieLearningWeb/UpGrade/blob/dfb995baf/clientlibs/js/src/Assignment/Assignment.ts#L39)

___

### markDecisionPoint

▸ **markDecisionPoint**(`status`, `uniquifier?`, `clientError?`): `Promise`<[`IMarkDecisionPoint`](../interfaces/types_Interfaces.UpGradeClientInterfaces.IMarkDecisionPoint.md)\>

Will record ("mark") that a user has "seen" an experiment condition per at the Assignment's decision point location (site + target).

Marking the decision point will record the user's condition assignment and the time of the decision point, regardless of whether the user is enrolled in an experiment.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `status` | `MARKED_DECISION_POINT_STATUS` | `status` signifies a client application's note on what it did in the code with condition assignment that Upgrade provided. Status can be one of the following: ```ts export enum MARKED_DECISION_POINT_STATUS { CONDITION_APPLIED = 'condition applied', CONDITION_FAILED_TO_APPLY = 'condition not applied', NO_CONDITION_ASSIGNED = 'no condition assigned', } ``` |
| `uniquifier?` | `string` | A `uniquifier` unique string can be sent along to help tie a user's logged metrics to a specific marked condition. This identifier will also need to be sent when calling `upgradeClient.log()` This is required for 'within-subjects' experiments. |
| `clientError?` | `string` | The client can also send along an additional `clientError` string to log context as to why a condition was not applied. |

#### Returns

`Promise`<[`IMarkDecisionPoint`](../interfaces/types_Interfaces.UpGradeClientInterfaces.IMarkDecisionPoint.md)\>

**`Example`**

```ts
import { MARKED_DECISION_POINT_STATUS } from 'upgrade_types';

const site = 'dashboard';
const target = 'experimental button';
const status: MARKED_DECISION_POINT_STATUS = MARKED_DECISION_POINT_STATUS.CONDITION_FAILED_TO_APPLY
const clientError = 'variant not recognized'; //optional

 ```ts
const assignment: Assignment[] = await upgradeClient.getDecisionPointAssignment(site, target);
const markResponse = await assignment.markDecisionPoint(MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED);
```

Note*: mark can also be called via `Client.markDecisionPoint()` without an Assignment object`:
```ts
import { MARKED_DECISION_POINT_STATUS } from 'upgrade_types';

const site = 'dashboard';
const target = 'experimental button';
const condition = 'variant_x'; // send null if no condition / no experiment is running / error
const status: MARKED_DECISION_POINT_STATUS = MARKED_DECISION_POINT_STATUS.CONDITION_FAILED_TO_APPLY
const clientError = 'variant not recognized'; //optional

const markResponse = await upgradeClient.markDecisionPoint(site, target, condition, MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED);
```

#### Defined in

[Assignment/Assignment.ts:118](https://github.com/CarnegieLearningWeb/UpGrade/blob/dfb995baf/clientlibs/js/src/Assignment/Assignment.ts#L118)
