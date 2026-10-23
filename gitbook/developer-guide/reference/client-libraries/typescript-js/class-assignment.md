# Class: Assignment

functions/getExperimentCondition.Assignment

## Table of contents

### Constructors

* constructor

### Accessors

* factors

### Methods

* getCondition
* getExperimentType
* getFactorLevel
* getFactorPayload
* getPayload
* markDecisionPoint

## Constructors

### constructor

• **new Assignment**(`conditionCode`, `payload`, `assignedFactor?`)

#### Parameters

| Name              | Type                                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| `conditionCode`   | `string`                                                                                              |
| `payload`         | `Object`                                                                                              |
| `payload.type`    | `PAYLOAD_TYPE`                                                                                        |
| `payload.value`   | `string`                                                                                              |
| `assignedFactor?` | `Record`<`string`, { `level`: `string` ; `payload`: { `type`: `PAYLOAD_TYPE` ; `value`: `string` } }> |

#### Defined in

[functions/getExperimentCondition.ts:10](https://github.com/CarnegieLearningWeb/UpGrade/blob/01c083e7/clientlibs/js/src/functions/getExperimentCondition.ts#L10)

## Accessors

### factors

• `get` **factors**(): `string`\[]

#### Returns

`string`\[]

#### Defined in

[functions/getExperimentCondition.ts:34](https://github.com/CarnegieLearningWeb/UpGrade/blob/01c083e7/clientlibs/js/src/functions/getExperimentCondition.ts#L34)

## Methods

### getCondition

▸ **getCondition**(): `string`

#### Returns

`string`

#### Defined in

[functions/getExperimentCondition.ts:22](https://github.com/CarnegieLearningWeb/UpGrade/blob/01c083e7/clientlibs/js/src/functions/getExperimentCondition.ts#L22)

***

### getExperimentType

▸ **getExperimentType**(): `EXPERIMENT_TYPE`

#### Returns

`EXPERIMENT_TYPE`

#### Defined in

[functions/getExperimentCondition.ts:30](https://github.com/CarnegieLearningWeb/UpGrade/blob/01c083e7/clientlibs/js/src/functions/getExperimentCondition.ts#L30)

***

### getFactorLevel

▸ **getFactorLevel**(`factor`): `string`

#### Parameters

| Name     | Type     |
| -------- | -------- |
| `factor` | `string` |

#### Returns

`string`

#### Defined in

[functions/getExperimentCondition.ts:38](https://github.com/CarnegieLearningWeb/UpGrade/blob/01c083e7/clientlibs/js/src/functions/getExperimentCondition.ts#L38)

***

### getFactorPayload

▸ **getFactorPayload**(`factor`): `IPayload`

#### Parameters

| Name     | Type     |
| -------- | -------- |
| `factor` | `string` |

#### Returns

`IPayload`

#### Defined in

[functions/getExperimentCondition.ts:46](https://github.com/CarnegieLearningWeb/UpGrade/blob/01c083e7/clientlibs/js/src/functions/getExperimentCondition.ts#L46)

***

### getPayload

▸ **getPayload**(): `IPayload`

#### Returns

`IPayload`

#### Defined in

[functions/getExperimentCondition.ts:26](https://github.com/CarnegieLearningWeb/UpGrade/blob/01c083e7/clientlibs/js/src/functions/getExperimentCondition.ts#L26)
