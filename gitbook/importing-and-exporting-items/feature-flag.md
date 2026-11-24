# Feature Flag

#### **Exporting and Importing Feature Flag Designs**

Feature flags are much simpler than experiments, but there are still some things to know if encountering issues importing:

{% hint style="info" %}
\
\
\
`id` a new UUID will be generated.\
\
`status` will automatically be changed to `disabled` .\
\
`featureFlagSegmentInclusion` `featureFlagSegmentExclusion` : individual or group lists added directly to a feature flag will be exported with the flag design and will be recreated when imported.\
\
Feature flag lists will all be reset to `disabled` as well.
{% endhint %}

{% hint style="warning" %}
`key` must be unique and not match an existing one in the environment \
\
`context` must be a valid "app-context" in the environment\
\
Any independent segments associated with the flag's inclusion or exclusion lists will NOT be imported. These will need to be exported and imported separately, and re-added to the flag manually.
{% endhint %}

**Example Exported Feature Flag Design JSON:**

```json
{
  "createdAt": "2026-02-03T21:32:05.927Z",
  "updatedAt": "2026-02-03T21:32:05.927Z",
  "versionNumber": 1,
  "id": "d376469a-0ab1-4180-8a54-4bf1ec080d0d",
  "name": "my-flag",
  "key": "MY-FLAG",
  "description": "cool feature",
  "context": ["upgrade-internal"],
  "tags": ["test"],
  "status": "disabled",
  "filterMode": "excludeAll",
  "featureFlagSegmentInclusion": [
    {
      "createdAt": "2026-02-03T21:32:34.803Z",
      "updatedAt": "2026-02-03T21:33:08.131Z",
      "versionNumber": 2,
      "segmentId": "bf7d5fc1-e348-47eb-88a6-6589b53bed2d",
      "featureFlagId": "d376469a-0ab1-4180-8a54-4bf1ec080d0d",
      "enabled": true,
      "listType": "Individual",
      "segment": {
        "createdAt": "2026-02-03T21:32:34.803Z",
        "updatedAt": "2026-02-03T21:32:34.803Z",
        "versionNumber": 1,
        "id": "bf7d5fc1-e348-47eb-88a6-6589b53bed2d",
        "name": "individuals",
        "description": "",
        "listType": "Individual",
        "context": "upgrade-internal",
        "type": "private",
        "tags": null,
        "individualForSegment": [
          {
            "createdAt": "2026-02-03T21:33:08.131Z",
            "updatedAt": "2026-02-03T21:33:08.131Z",
            "versionNumber": 1,
            "segmentId": "bf7d5fc1-e348-47eb-88a6-6589b53bed2d",
            "userId": "a"
          },
          {
            "createdAt": "2026-02-03T21:33:08.131Z",
            "updatedAt": "2026-02-03T21:33:08.131Z",
            "versionNumber": 1,
            "segmentId": "bf7d5fc1-e348-47eb-88a6-6589b53bed2d",
            "userId": "b"
          },
          {
            "createdAt": "2026-02-03T21:33:08.131Z",
            "updatedAt": "2026-02-03T21:33:08.131Z",
            "versionNumber": 1,
            "segmentId": "bf7d5fc1-e348-47eb-88a6-6589b53bed2d",
            "userId": "c"
          }
        ],
        "groupForSegment": [],
        "subSegments": []
      }
    },
    {
      "createdAt": "2026-02-03T21:33:17.313Z",
      "updatedAt": "2026-02-03T21:33:17.313Z",
      "versionNumber": 1,
      "segmentId": "026e4041-4d88-446b-a23b-2b5088d675dd",
      "featureFlagId": "d376469a-0ab1-4180-8a54-4bf1ec080d0d",
      "enabled": false,
      "listType": "classId",
      "segment": {
        "createdAt": "2026-02-03T21:33:17.313Z",
        "updatedAt": "2026-02-03T21:33:17.313Z",
        "versionNumber": 1,
        "id": "026e4041-4d88-446b-a23b-2b5088d675dd",
        "name": "class",
        "description": "",
        "listType": "classId",
        "context": "upgrade-internal",
        "type": "private",
        "tags": null,
        "individualForSegment": [],
        "groupForSegment": [
          {
            "createdAt": "2026-02-03T21:33:17.313Z",
            "updatedAt": "2026-02-03T21:33:17.313Z",
            "versionNumber": 1,
            "segmentId": "026e4041-4d88-446b-a23b-2b5088d675dd",
            "groupId": "included class",
            "type": "classId"
          }
        ],
        "subSegments": []
      }
    }
  ],
  "featureFlagSegmentExclusion": [
    {
      "createdAt": "2026-02-03T21:32:54.784Z",
      "updatedAt": "2026-02-03T21:32:54.784Z",
      "versionNumber": 1,
      "segmentId": "58cf8e87-4a0f-45fd-988a-cca904bf8bfd",
      "featureFlagId": "d376469a-0ab1-4180-8a54-4bf1ec080d0d",
      "enabled": true,
      "listType": "classId",
      "segment": {
        "createdAt": "2026-02-03T21:32:54.784Z",
        "updatedAt": "2026-02-03T21:32:54.784Z",
        "versionNumber": 1,
        "id": "58cf8e87-4a0f-45fd-988a-cca904bf8bfd",
        "name": "excluded class",
        "description": "",
        "listType": "classId",
        "context": "upgrade-internal",
        "type": "private",
        "tags": null,
        "individualForSegment": [],
        "groupForSegment": [
          {
            "createdAt": "2026-02-03T21:32:54.784Z",
            "updatedAt": "2026-02-03T21:32:54.784Z",
            "versionNumber": 1,
            "segmentId": "58cf8e87-4a0f-45fd-988a-cca904bf8bfd",
            "groupId": "not-this-class",
            "type": "classId"
          }
        ],
        "subSegments": []
      }
    }
  ]
}

```

***
