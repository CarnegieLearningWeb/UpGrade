# Experiment

#### **Exporting and Importing Experiment Designs**

Exported experiment JSON data can be rather large and complex, especially when multiple decision points and conditions are involved as each associated object's metadata tends to be exported as well.\
\
An imported experiment will be created the same as a new experiment, and UpGrade will do its best to replicate the imported design and its associated entities as close as possible. Here are the things to know:

#### Key Properties when Importing

{% hint style="info" %}
`id` (UUID) fields are re-generated when importing.\
\
`conditions`, `partitions` (aka decision points), `conditionPayloads`, `queries` objects and their metadata will be recreated.\
\
`experimentSegmentInclusion` `experimentSegmentExclusion` : individual or group lists added directly to an experiment will be exported with the experiment design and will be recreated when imported.\
\
`stateTimeLogs` will be empty.\
\
`state` will reset to "inactive".\
\
No experiment enrollment data will be exported, just the design properties.
{% endhint %}

{% hint style="warning" %}
Any independent segments associated with the experiment will NOT be imported. These will need to be exported and imported separately, and re-added to the experiment manually.\
\
Be sure the `context` exists if importing into new environment.\
\
If using `group` or metrics associated with `queries` these will also need to exist in new environment.\
\
Some fields can cause a failure to import if modified directly.
{% endhint %}

\
**Example Experiment Design Export JSON:**

```json
{
  "createdAt": "2025-01-14T16:09:33.165Z",
  "updatedAt": "2025-01-14T17:23:00.449Z",
  "versionNumber": 3,
  "id": "028e1a5f-c784-41cc-be1c-18b4e61b8a70",
  "name": "Mathia Workspace Test 3",
  "description": "MSQAD-121",
  "context": ["assign-prog"],
  "state": "enrolling",
  "startOn": "2025-01-14T16:09:26.414Z",
  "consistencyRule": "individual",
  "assignmentUnit": "individual",
  "postExperimentRule": "continue",
  "enrollmentCompleteCondition": null,
  "endOn": null,
  "revertTo": null,
  "tags": [],
  "group": null,
  "conditionOrder": null,
  "assignmentAlgorithm": "random",
  "filterMode": "excludeAll",
  "backendVersion": "6.3.0",
  "type": "Simple",
  "partitions": [
    {
      "createdAt": "2025-01-14T16:09:33.165Z",
      "updatedAt": "2025-01-14T17:23:00.449Z",
      "versionNumber": 1,
      "id": "2efcf2c7-cfee-4396-9dc9-d265c01d6493",
      "twoCharacterId": "RF",
      "site": "SelectSection",
      "target": "worksheet_grapher_a1_patterns_1step_eqn_ops",
      "description": "",
      "order": 1,
      "excludeIfReached": false
    }
  ],
  "conditions": [
    {
      "createdAt": "2025-01-14T16:09:33.165Z",
      "updatedAt": "2025-01-14T17:23:00.449Z",
      "versionNumber": 1,
      "id": "19eb17bb-7b22-4efc-b0e4-8504f82f181a",
      "twoCharacterId": "NV",
      "name": "",
      "description": null,
      "conditionCode": "goal_first_b",
      "assignmentWeight": 50,
      "order": 1,
      "conditionPayloads": [
        {
          "createdAt": "2025-01-14T16:09:33.165Z",
          "updatedAt": "2025-01-14T17:23:00.449Z",
          "versionNumber": 1,
          "id": "03e15e78-2728-4e69-980b-618d24b01a83",
          "payloadValue": "goal_first_b",
          "payloadType": "string"
        }
      ],
      "levelCombinationElements": []
    },
    {
      "createdAt": "2025-01-14T16:09:33.165Z",
      "updatedAt": "2025-01-14T17:23:00.449Z",
      "versionNumber": 1,
      "id": "fc5fb565-d9b2-49e6-8e81-da41080a64f9",
      "twoCharacterId": "ZP",
      "name": "",
      "description": null,
      "conditionCode": "goal_first_c",
      "assignmentWeight": 50,
      "order": 2,
      "conditionPayloads": [
        {
          "createdAt": "2025-01-14T16:09:33.165Z",
          "updatedAt": "2025-01-14T17:23:00.449Z",
          "versionNumber": 1,
          "id": "8bbda293-09a3-4ba8-a16c-c1bc890624bd",
          "payloadValue": "goal_first_c",
          "payloadType": "string"
        }
      ],
      "levelCombinationElements": []
    }
  ],
  "stateTimeLogs": [
    {
      "createdAt": "2025-01-14T16:09:59.483Z",
      "updatedAt": "2025-01-14T16:09:59.483Z",
      "versionNumber": 1,
      "id": "9ef60b53-001f-4635-b0a0-907d769ecfd2",
      "fromState": "scheduled",
      "toState": "enrolling",
      "timeLog": "2025-01-14T16:09:59.476Z"
    }
  ],
  "queries": [
    {
      "createdAt": "2025-01-14T16:09:33.165Z",
      "updatedAt": "2025-01-14T17:23:00.449Z",
      "versionNumber": 1,
      "id": "4a107cac-45dd-4c36-880b-12b9bc9a6ca2",
      "name": "mw",
      "query": { "operationType": "min" },
      "repeatedMeasure": "MOST RECENT",
      "metric": {
        "createdAt": "2024-10-25T17:38:19.458Z",
        "updatedAt": "2024-10-25T17:38:19.458Z",
        "versionNumber": 1,
        "key": "masteryWorkspace@__@worksheet_grapher_a1_patterns_1step_eqn_ops@__@timeSeconds",
        "type": "continuous",
        "allowedData": null,
        "context": ["assign-prog"]
      }
    }
  ],
  "experimentSegmentInclusion": [
    {
      "createdAt": "2025-01-14T16:09:33.165Z",
      "updatedAt": "2025-01-14T16:09:33.165Z",
      "versionNumber": 1,
      "segmentId": "a4fe21b6-0641-41d4-926b-9872bd6bd6ef",
      "experimentId": "028e1a5f-c784-41cc-be1c-18b4e61b8a70",
      "segment": {
        "createdAt": "2025-01-14T16:09:33.191Z",
        "updatedAt": "2025-01-14T16:09:33.191Z",
        "versionNumber": 1,
        "id": "a4fe21b6-0641-41d4-926b-9872bd6bd6ef",
        "name": "028e1a5f-c784-41cc-be1c-18b4e61b8a70 Inclusion Segment",
        "description": "028e1a5f-c784-41cc-be1c-18b4e61b8a70 Inclusion Segment",
        "listType": null,
        "context": "assign-prog",
        "type": "private",
        "tags": null,
        "individualForSegment": [
          {
            "createdAt": "2025-01-14T17:23:00.525Z",
            "updatedAt": "2025-01-14T17:23:00.525Z",
            "versionNumber": 1,
            "segmentId": "a4fe21b6-0641-41d4-926b-9872bd6bd6ef",
            "userId": "f1b22b20-e682-44e5-99d1-66ddcb2aadf7"
          },
          {
            "createdAt": "2025-01-14T17:23:00.525Z",
            "updatedAt": "2025-01-14T17:23:00.525Z",
            "versionNumber": 1,
            "segmentId": "a4fe21b6-0641-41d4-926b-9872bd6bd6ef",
            "userId": "b1445f4b-7942-46bf-9cfd-b204aa42818f"
          }
        ],
        "groupForSegment": [],
        "subSegments": []
      }
    }
  ],
  "experimentSegmentExclusion": [
    {
      "createdAt": "2025-01-14T16:09:33.165Z",
      "updatedAt": "2025-01-14T16:09:33.165Z",
      "versionNumber": 1,
      "segmentId": "d806c5a6-6930-4546-9287-eaed9b79e4a8",
      "experimentId": "028e1a5f-c784-41cc-be1c-18b4e61b8a70",
      "segment": {
        "createdAt": "2025-01-14T16:09:33.225Z",
        "updatedAt": "2025-01-14T16:09:33.225Z",
        "versionNumber": 1,
        "id": "d806c5a6-6930-4546-9287-eaed9b79e4a8",
        "name": "028e1a5f-c784-41cc-be1c-18b4e61b8a70 Exclusion Segment",
        "description": "028e1a5f-c784-41cc-be1c-18b4e61b8a70 Exclusion Segment",
        "listType": null,
        "context": "assign-prog",
        "type": "private",
        "tags": null,
        "individualForSegment": [],
        "groupForSegment": [],
        "subSegments": []
      }
    }
  ],
  "factors": [],
  "stratificationFactor": null,
  "conditionPayloads": [
    {
      "createdAt": "2025-01-14T16:09:33.165Z",
      "updatedAt": "2025-01-14T17:23:00.449Z",
      "versionNumber": 1,
      "id": "03e15e78-2728-4e69-980b-618d24b01a83",
      "parentCondition": "19eb17bb-7b22-4efc-b0e4-8504f82f181a",
      "decisionPoint": "2efcf2c7-cfee-4396-9dc9-d265c01d6493",
      "payload": { "type": "string", "value": "goal_first_b" }
    },
    {
      "createdAt": "2025-01-14T16:09:33.165Z",
      "updatedAt": "2025-01-14T17:23:00.449Z",
      "versionNumber": 1,
      "id": "8bbda293-09a3-4ba8-a16c-c1bc890624bd",
      "parentCondition": "fc5fb565-d9b2-49e6-8e81-da41080a64f9",
      "decisionPoint": "2efcf2c7-cfee-4396-9dc9-d265c01d6493",
      "payload": { "type": "string", "value": "goal_first_c" }
    }
  ]
}

```

```json

 {
  "createdAt": "2025-01-14T16:09:33.165Z",
  "updatedAt": "2025-01-14T17:23:00.449Z",
  "versionNumber": 3,
  "id": "028e1a5f-c784-41cc-be1c-18b4e61b8a70",
  "name": "Mathia Workspace Test 3",
  "description": "MSQAD-121",
  "context": ["assign-prog"],
  "state": "enrolling",
  "startOn": "2025-01-14T16:09:26.414Z",
  "consistencyRule": "individual",
  "assignmentUnit": "individual",
  "postExperimentRule": "continue",
  "enrollmentCompleteCondition": null,
  "endOn": null,
  "revertTo": null,
  "tags": [],
  "group": null,
  "conditionOrder": null,
  "assignmentAlgorithm": "random",
  "filterMode": "excludeAll",
  "backendVersion": "6.3.0",
  "type": "Simple",
  "partitions": [
    {
      "createdAt": "2025-01-14T16:09:33.165Z",
      "updatedAt": "2025-01-14T17:23:00.449Z",
      "versionNumber": 1,
      "id": "2efcf2c7-cfee-4396-9dc9-d265c01d6493",
      "twoCharacterId": "RF",
      "site": "SelectSection",
      "target": "worksheet_grapher_a1_patterns_1step_eqn_ops",
      "description": "",
      "order": 1,
      "excludeIfReached": false
    }
  ],
  "conditions": [
    {
      "createdAt": "2025-01-14T16:09:33.165Z",
      "updatedAt": "2025-01-14T17:23:00.449Z",
      "versionNumber": 1,
      "id": "19eb17bb-7b22-4efc-b0e4-8504f82f181a",
      "twoCharacterId": "NV",
      "name": "",
      "description": null,
      "conditionCode": "goal_first_b",
      "assignmentWeight": 50,
      "order": 1,
      "conditionPayloads": [
        {
          "createdAt": "2025-01-14T16:09:33.165Z",
          "updatedAt": "2025-01-14T17:23:00.449Z",
          "versionNumber": 1,
          "id": "03e15e78-2728-4e69-980b-618d24b01a83",
          "payloadValue": "goal_first_b",
          "payloadType": "string"
        }
      ],
      "levelCombinationElements": []
    },
    {
      "createdAt": "2025-01-14T16:09:33.165Z",
      "updatedAt": "2025-01-14T17:23:00.449Z",
      "versionNumber": 1,
      "id": "fc5fb565-d9b2-49e6-8e81-da41080a64f9",
      "twoCharacterId": "ZP",
      "name": "",
      "description": null,
      "conditionCode": "goal_first_c",
      "assignmentWeight": 50,
      "order": 2,
      "conditionPayloads": [
        {
          "createdAt": "2025-01-14T16:09:33.165Z",
          "updatedAt": "2025-01-14T17:23:00.449Z",
          "versionNumber": 1,
          "id": "8bbda293-09a3-4ba8-a16c-c1bc890624bd",
          "payloadValue": "goal_first_c",
          "payloadType": "string"
        }
      ],
      "levelCombinationElements": []
    }
  ],
  "stateTimeLogs": [
    {
      "createdAt": "2025-01-14T16:09:59.483Z",
      "updatedAt": "2025-01-14T16:09:59.483Z",
      "versionNumber": 1,
      "id": "9ef60b53-001f-4635-b0a0-907d769ecfd2",
      "fromState": "scheduled",
      "toState": "enrolling",
      "timeLog": "2025-01-14T16:09:59.476Z"
    }
  ],
  "queries": [
    {
      "createdAt": "2025-01-14T16:09:33.165Z",
      "updatedAt": "2025-01-14T17:23:00.449Z",
      "versionNumber": 1,
      "id": "4a107cac-45dd-4c36-880b-12b9bc9a6ca2",
      "name": "mw",
      "query": { "operationType": "min" },
      "repeatedMeasure": "MOST RECENT",
      "metric": {
        "createdAt": "2024-10-25T17:38:19.458Z",
        "updatedAt": "2024-10-25T17:38:19.458Z",
        "versionNumber": 1,
        "key": "masteryWorkspace@__@worksheet_grapher_a1_patterns_1step_eqn_ops@__@timeSeconds",
        "type": "continuous",
        "allowedData": null,
        "context": ["assign-prog"]
      }
    }
  ],
  "experimentSegmentInclusion": [
    {
      "createdAt": "2025-01-14T16:09:33.165Z",
      "updatedAt": "2025-01-14T16:09:33.165Z",
      "versionNumber": 1,
      "segmentId": "a4fe21b6-0641-41d4-926b-9872bd6bd6ef",
      "experimentId": "028e1a5f-c784-41cc-be1c-18b4e61b8a70",
      "segment": {
        "createdAt": "2025-01-14T16:09:33.191Z",
        "updatedAt": "2025-01-14T16:09:33.191Z",
        "versionNumber": 1,
        "id": "a4fe21b6-0641-41d4-926b-9872bd6bd6ef",
        "name": "028e1a5f-c784-41cc-be1c-18b4e61b8a70 Inclusion Segment",
        "description": "028e1a5f-c784-41cc-be1c-18b4e61b8a70 Inclusion Segment",
        "listType": null,
        "context": "assign-prog",
        "type": "private",
        "tags": null,
        "individualForSegment": [
          {
            "createdAt": "2025-01-14T17:23:00.525Z",
            "updatedAt": "2025-01-14T17:23:00.525Z",
            "versionNumber": 1,
            "segmentId": "a4fe21b6-0641-41d4-926b-9872bd6bd6ef",
            "userId": "f1b22b20-e682-44e5-99d1-66ddcb2aadf7"
          },
          {
            "createdAt": "2025-01-14T17:23:00.525Z",
            "updatedAt": "2025-01-14T17:23:00.525Z",
            "versionNumber": 1,
            "segmentId": "a4fe21b6-0641-41d4-926b-9872bd6bd6ef",
            "userId": "b1445f4b-7942-46bf-9cfd-b204aa42818f"
          }
        ],
        "groupForSegment": [],
        "subSegments": []
      }
    }
  ],
  "experimentSegmentExclusion": [
    {
      "createdAt": "2025-01-14T16:09:33.165Z",
      "updatedAt": "2025-01-14T16:09:33.165Z",
      "versionNumber": 1,
      "segmentId": "d806c5a6-6930-4546-9287-eaed9b79e4a8",
      "experimentId": "028e1a5f-c784-41cc-be1c-18b4e61b8a70",
      "segment": {
        "createdAt": "2025-01-14T16:09:33.225Z",
        "updatedAt": "2025-01-14T16:09:33.225Z",
        "versionNumber": 1,
        "id": "d806c5a6-6930-4546-9287-eaed9b79e4a8",
        "name": "028e1a5f-c784-41cc-be1c-18b4e61b8a70 Exclusion Segment",
        "description": "028e1a5f-c784-41cc-be1c-18b4e61b8a70 Exclusion Segment",
        "listType": null,
        "context": "assign-prog",
        "type": "private",
        "tags": null,
        "individualForSegment": [],
        "groupForSegment": [],
        "subSegments": []
      }
    }
  ],
  "factors": [],
  "stratificationFactor": null,
  "conditionPayloads": [
    {
      "createdAt": "2025-01-14T16:09:33.165Z",
      "updatedAt": "2025-01-14T17:23:00.449Z",
      "versionNumber": 1,
      "id": "03e15e78-2728-4e69-980b-618d24b01a83",
      "parentCondition": "19eb17bb-7b22-4efc-b0e4-8504f82f181a",
      "decisionPoint": "2efcf2c7-cfee-4396-9dc9-d265c01d6493",
      "payload": { "type": "string", "value": "goal_first_b" }
    },
    {
      "createdAt": "2025-01-14T16:09:33.165Z",
      "updatedAt": "2025-01-14T17:23:00.449Z",
      "versionNumber": 1,
      "id": "8bbda293-09a3-4ba8-a16c-c1bc890624bd",
      "parentCondition": "fc5fb565-d9b2-49e6-8e81-da41080a64f9",
      "decisionPoint": "2efcf2c7-cfee-4396-9dc9-d265c01d6493",
      "payload": { "type": "string", "value": "goal_first_c" }
    }
  ]
}


```



**Mooclet Experiment Example:**

For experiments using mooclet adaptive algorithms, the `moocletPolicyParameters` configuration will be copied over exactly, and associated Mooclet entities will be recreated in same manner as when creating a new adaptive experiment.

{% hint style="info" %}
When exporting mooclet experiments, the `current_posteriors` field is automatically removed from `moocletPolicyParameters` to avoid importing stale data.\
\
The `outcome_variable_name` will be regenerated.
{% endhint %}

{% hint style="warning" %}
Mooclet API must be enabled and up and running if importing into new environment, or the import will fail.&#x20;
{% endhint %}

```json
{
  "id": "f66b0483-cf7e-4842-85f7-0a52108230b9",
  "name": "Adaptive Learning Test",
  "assignmentAlgorithm": "ts_configurable",
  "moocletPolicyParameters": {
        "prior": {
            "failure": 1,
            "success": 1
        },
        "batch_size": 1,
        "max_rating": 1,
        "min_rating": 0,
        "tspostdiff_thresh": 0,
        "uniform_threshold": 0,
        "assignmentAlgorithm": "ts_configurable",
        "outcome_variable_name": "asdfasdf_2026-02-03T19:30:46.005Z_REWARD_VARIABLE"
    },
  ...
}
```
