# Interface: IHttpClientWrapper

[types/Interfaces](../modules/types_Interfaces.md).[UpGradeClientInterfaces](../modules/types_Interfaces.UpGradeClientInterfaces.md).IHttpClientWrapper

## Table of contents

### Properties

- [config](types_Interfaces.UpGradeClientInterfaces.IHttpClientWrapper.md#config)
- [doGet](types_Interfaces.UpGradeClientInterfaces.IHttpClientWrapper.md#doget)
- [doPatch](types_Interfaces.UpGradeClientInterfaces.IHttpClientWrapper.md#dopatch)
- [doPost](types_Interfaces.UpGradeClientInterfaces.IHttpClientWrapper.md#dopost)

## Properties

### config

• `Optional` **config**: [`IHttpClientWrapperRequestConfig`](types_Interfaces.UpGradeClientInterfaces.IHttpClientWrapperRequestConfig.md)

#### Defined in

[types/Interfaces.ts:81](https://github.com/CarnegieLearningWeb/UpGrade/blob/dfb995baf/clientlibs/js/src/types/Interfaces.ts#L81)

___

### doGet

• **doGet**: <ResponseType\>(`url`: `string`, `options`: [`IHttpClientWrapperRequestConfig`](types_Interfaces.UpGradeClientInterfaces.IHttpClientWrapperRequestConfig.md)) => `Promise`<`ResponseType`\>

#### Type declaration

▸ <`ResponseType`\>(`url`, `options`): `Promise`<`ResponseType`\>

##### Type parameters

| Name |
| :------ |
| `ResponseType` |

##### Parameters

| Name | Type |
| :------ | :------ |
| `url` | `string` |
| `options` | [`IHttpClientWrapperRequestConfig`](types_Interfaces.UpGradeClientInterfaces.IHttpClientWrapperRequestConfig.md) |

##### Returns

`Promise`<`ResponseType`\>

#### Defined in

[types/Interfaces.ts:82](https://github.com/CarnegieLearningWeb/UpGrade/blob/dfb995baf/clientlibs/js/src/types/Interfaces.ts#L82)

___

### doPatch

• **doPatch**: <ResponseType, RequestBodyType\>(`url`: `string`, `body`: `RequestBodyType`, `options`: [`IHttpClientWrapperRequestConfig`](types_Interfaces.UpGradeClientInterfaces.IHttpClientWrapperRequestConfig.md)) => `Promise`<`ResponseType`\>

#### Type declaration

▸ <`ResponseType`, `RequestBodyType`\>(`url`, `body`, `options`): `Promise`<`ResponseType`\>

##### Type parameters

| Name |
| :------ |
| `ResponseType` |
| `RequestBodyType` |

##### Parameters

| Name | Type |
| :------ | :------ |
| `url` | `string` |
| `body` | `RequestBodyType` |
| `options` | [`IHttpClientWrapperRequestConfig`](types_Interfaces.UpGradeClientInterfaces.IHttpClientWrapperRequestConfig.md) |

##### Returns

`Promise`<`ResponseType`\>

#### Defined in

[types/Interfaces.ts:88](https://github.com/CarnegieLearningWeb/UpGrade/blob/dfb995baf/clientlibs/js/src/types/Interfaces.ts#L88)

___

### doPost

• **doPost**: <ResponseType, RequestBodyType\>(`url`: `string`, `body`: `RequestBodyType`, `options`: [`IHttpClientWrapperRequestConfig`](types_Interfaces.UpGradeClientInterfaces.IHttpClientWrapperRequestConfig.md)) => `Promise`<`ResponseType`\>

#### Type declaration

▸ <`ResponseType`, `RequestBodyType`\>(`url`, `body`, `options`): `Promise`<`ResponseType`\>

##### Type parameters

| Name |
| :------ |
| `ResponseType` |
| `RequestBodyType` |

##### Parameters

| Name | Type |
| :------ | :------ |
| `url` | `string` |
| `body` | `RequestBodyType` |
| `options` | [`IHttpClientWrapperRequestConfig`](types_Interfaces.UpGradeClientInterfaces.IHttpClientWrapperRequestConfig.md) |

##### Returns

`Promise`<`ResponseType`\>

#### Defined in

[types/Interfaces.ts:83](https://github.com/CarnegieLearningWeb/UpGrade/blob/dfb995baf/clientlibs/js/src/types/Interfaces.ts#L83)
