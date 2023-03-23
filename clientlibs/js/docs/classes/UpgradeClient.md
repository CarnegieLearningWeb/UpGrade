[upgrade_client_lib](../README.md) / [Exports](../modules.md) / UpgradeClient

# Class: UpgradeClient

## Table of contents

### Constructors

- [constructor](UpgradeClient.md#constructor)

### Properties

- [api](UpgradeClient.md#api)
- [clientSessionId](UpgradeClient.md#clientsessionid)
- [experimentConditionData](UpgradeClient.md#experimentconditiondata)
- [featureFlags](UpgradeClient.md#featureflags)
- [group](UpgradeClient.md#group)
- [hostUrl](UpgradeClient.md#hosturl)
- [token](UpgradeClient.md#token)
- [userId](UpgradeClient.md#userid)
- [workingGroup](UpgradeClient.md#workinggroup)

### Methods

- [addMetrics](UpgradeClient.md#addmetrics)
- [getAllExperimentConditions](UpgradeClient.md#getallexperimentconditions)
- [getAllFeatureFlags](UpgradeClient.md#getallfeatureflags)
- [getExperimentCondition](UpgradeClient.md#getexperimentcondition)
- [getFeatureFlag](UpgradeClient.md#getfeatureflag)
- [init](UpgradeClient.md#init)
- [log](UpgradeClient.md#log)
- [markExperimentPoint](UpgradeClient.md#markexperimentpoint)
- [setAltUserIds](UpgradeClient.md#setaltuserids)
- [setGroupMembership](UpgradeClient.md#setgroupmembership)
- [setWorkingGroup](UpgradeClient.md#setworkinggroup)
- [validateClient](UpgradeClient.md#validateclient)

## Constructors

### constructor

• **new UpgradeClient**(`userId`, `hostUrl`, `options?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `userId` | `string` |
| `hostUrl` | `string` |
| `options?` | `Object` |
| `options.clientSessionId?` | `string` |
| `options.token?` | `string` |

#### Defined in

[UpgradeClient.ts:48](https://github.com/CarnegieLearningWeb/UpGrade/blob/a94546f0/clientlibs/js/src/UpgradeClient.ts#L48)

## Properties

### api

• `Private` **api**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `addMetrics` | `any` |
| `altUserIds` | `any` |
| `failedExperimentPoint` | `any` |
| `getAllExperimentConditions` | `any` |
| `getAllFeatureFlag` | `any` |
| `init` | `any` |
| `log` | `any` |
| `markExperimentPoint` | `any` |
| `setGroupMemberShip` | `any` |
| `setWorkingGroup` | `any` |

#### Defined in

[UpgradeClient.ts:25](https://github.com/CarnegieLearningWeb/UpGrade/blob/a94546f0/clientlibs/js/src/UpgradeClient.ts#L25)

___

### clientSessionId

• `Private` **clientSessionId**: `string`

#### Defined in

[UpgradeClient.ts:41](https://github.com/CarnegieLearningWeb/UpGrade/blob/a94546f0/clientlibs/js/src/UpgradeClient.ts#L41)

___

### experimentConditionData

• `Private` **experimentConditionData**: `IExperimentAssignment`[] = `null`

#### Defined in

[UpgradeClient.ts:45](https://github.com/CarnegieLearningWeb/UpGrade/blob/a94546f0/clientlibs/js/src/UpgradeClient.ts#L45)

___

### featureFlags

• `Private` **featureFlags**: `IFeatureFlag`[] = `null`

#### Defined in

[UpgradeClient.ts:46](https://github.com/CarnegieLearningWeb/UpGrade/blob/a94546f0/clientlibs/js/src/UpgradeClient.ts#L46)

___

### group

• `Private` **group**: `Record`<`string`, `string`[]\> = `null`

#### Defined in

[UpgradeClient.ts:43](https://github.com/CarnegieLearningWeb/UpGrade/blob/a94546f0/clientlibs/js/src/UpgradeClient.ts#L43)

___

### hostUrl

• `Private` **hostUrl**: `string`

#### Defined in

[UpgradeClient.ts:38](https://github.com/CarnegieLearningWeb/UpGrade/blob/a94546f0/clientlibs/js/src/UpgradeClient.ts#L38)

___

### token

• `Private` **token**: `string`

#### Defined in

[UpgradeClient.ts:40](https://github.com/CarnegieLearningWeb/UpGrade/blob/a94546f0/clientlibs/js/src/UpgradeClient.ts#L40)

___

### userId

• `Private` **userId**: `string`

#### Defined in

[UpgradeClient.ts:37](https://github.com/CarnegieLearningWeb/UpGrade/blob/a94546f0/clientlibs/js/src/UpgradeClient.ts#L37)

___

### workingGroup

• `Private` **workingGroup**: `Record`<`string`, `string`\> = `null`

#### Defined in

[UpgradeClient.ts:44](https://github.com/CarnegieLearningWeb/UpGrade/blob/a94546f0/clientlibs/js/src/UpgradeClient.ts#L44)

## Methods

### addMetrics

▸ **addMetrics**(`metrics`): `Promise`<`IMetric`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `metrics` | (`IGroupMetric` \| `ISingleMetric`)[] |

#### Returns

`Promise`<`IMetric`[]\>

#### Defined in

[UpgradeClient.ts:187](https://github.com/CarnegieLearningWeb/UpGrade/blob/a94546f0/clientlibs/js/src/UpgradeClient.ts#L187)

___

### getAllExperimentConditions

▸ **getAllExperimentConditions**(`context`): `Promise`<`IExperimentAssignment`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `string` |

#### Returns

`Promise`<`IExperimentAssignment`[]\>

#### Defined in

[UpgradeClient.ts:121](https://github.com/CarnegieLearningWeb/UpGrade/blob/a94546f0/clientlibs/js/src/UpgradeClient.ts#L121)

___

### getAllFeatureFlags

▸ **getAllFeatureFlags**(): `Promise`<`IFeatureFlag`[]\>

#### Returns

`Promise`<`IFeatureFlag`[]\>

#### Defined in

[UpgradeClient.ts:163](https://github.com/CarnegieLearningWeb/UpGrade/blob/a94546f0/clientlibs/js/src/UpgradeClient.ts#L163)

___

### getExperimentCondition

▸ **getExperimentCondition**(`context`, `site`, `target?`): `Promise`<`IExperimentAssignment`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `string` |
| `site` | `string` |
| `target?` | `string` |

#### Returns

`Promise`<`IExperimentAssignment`\>

#### Defined in

[UpgradeClient.ts:136](https://github.com/CarnegieLearningWeb/UpGrade/blob/a94546f0/clientlibs/js/src/UpgradeClient.ts#L136)

___

### getFeatureFlag

▸ **getFeatureFlag**(`key`): `IFeatureFlag`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`IFeatureFlag`

#### Defined in

[UpgradeClient.ts:172](https://github.com/CarnegieLearningWeb/UpGrade/blob/a94546f0/clientlibs/js/src/UpgradeClient.ts#L172)

___

### init

▸ **init**(`group?`, `workingGroup?`): `Promise`<`IUser`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `group?` | `Record`<`string`, `string`[]\> |
| `workingGroup?` | `Record`<`string`, `string`\> |

#### Returns

`Promise`<`IUser`\>

#### Defined in

[UpgradeClient.ts:76](https://github.com/CarnegieLearningWeb/UpGrade/blob/a94546f0/clientlibs/js/src/UpgradeClient.ts#L76)

___

### log

▸ **log**(`value`, `sendAsAnalytics?`): `Promise`<`ILog`[]\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `value` | `ILogInput`[] | `undefined` |
| `sendAsAnalytics` | `boolean` | `false` |

#### Returns

`Promise`<`ILog`[]\>

#### Defined in

[UpgradeClient.ts:177](https://github.com/CarnegieLearningWeb/UpGrade/blob/a94546f0/clientlibs/js/src/UpgradeClient.ts#L177)

___

### markExperimentPoint

▸ **markExperimentPoint**(`site`, `condition`, `status`, `target?`): `Promise`<`IMarkExperimentPoint`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `site` | `string` |
| `condition` | `string` |
| `status` | `MARKED_DECISION_POINT_STATUS` |
| `target?` | `string` |

#### Returns

`Promise`<`IMarkExperimentPoint`\>

#### Defined in

[UpgradeClient.ts:144](https://github.com/CarnegieLearningWeb/UpGrade/blob/a94546f0/clientlibs/js/src/UpgradeClient.ts#L144)

___

### setAltUserIds

▸ **setAltUserIds**(`altUserIds`): `Promise`<`IExperimentUserAliases`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `altUserIds` | `string`[] |

#### Returns

`Promise`<`IExperimentUserAliases`\>

#### Defined in

[UpgradeClient.ts:182](https://github.com/CarnegieLearningWeb/UpGrade/blob/a94546f0/clientlibs/js/src/UpgradeClient.ts#L182)

___

### setGroupMembership

▸ **setGroupMembership**(`group`): `Promise`<`IUser`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `group` | `Record`<`string`, `string`[]\> |

#### Returns

`Promise`<`IUser`\>

#### Defined in

[UpgradeClient.ts:81](https://github.com/CarnegieLearningWeb/UpGrade/blob/a94546f0/clientlibs/js/src/UpgradeClient.ts#L81)

___

### setWorkingGroup

▸ **setWorkingGroup**(`workingGroup`): `Promise`<`IUser`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `workingGroup` | `Record`<`string`, `string`\> |

#### Returns

`Promise`<`IUser`\>

#### Defined in

[UpgradeClient.ts:101](https://github.com/CarnegieLearningWeb/UpGrade/blob/a94546f0/clientlibs/js/src/UpgradeClient.ts#L101)

___

### validateClient

▸ `Private` **validateClient**(): `void`

#### Returns

`void`

#### Defined in

[UpgradeClient.ts:67](https://github.com/CarnegieLearningWeb/UpGrade/blob/a94546f0/clientlibs/js/src/UpgradeClient.ts#L67)
