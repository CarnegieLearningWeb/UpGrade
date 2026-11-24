# Segment

#### Segments

Segments contain lists of individual ids, group ids, or references to other segments (subsegments).&#x20;

{% hint style="info" %}
`id` a new UUID will be generated.\
\
Associated list objects exported with the segment will be recreated.
{% endhint %}

{% hint style="warning" %}
`context` must be a valid "app-context" in the environment\
\
Subsegment references to unknown public segment ids in a different environment will not be recreated. These will need to be imported and exported separately and readded.
{% endhint %}

**Example Segment JSON:**

```json
{
  "createdAt": "2026-02-03T21:44:18.466Z",
  "updatedAt": "2026-02-03T21:44:18.466Z",
  "versionNumber": 1,
  "id": "347903ec-55f9-4eb1-af2e-445a8f8c6d6e",
  "name": "my-segment",
  "description": "",
  "listType": null,
  "context": "upgrade-internal",
  "type": "public",
  "tags": ["test"],
  "individualForSegment": [],
  "groupForSegment": [],
  "subSegments": [
    {
      "createdAt": "2026-02-03T21:45:06.436Z",
      "updatedAt": "2026-02-03T21:45:06.436Z",
      "versionNumber": 1,
      "id": "c3789484-2a1b-445e-8cea-65cd866bedc5",
      "name": "students",
      "description": "",
      "listType": "Individual",
      "context": "upgrade-internal",
      "type": "private",
      "tags": null,
      "individualForSegment": [
        {
          "createdAt": "2026-02-03T21:45:06.436Z",
          "updatedAt": "2026-02-03T21:45:06.436Z",
          "versionNumber": 1,
          "segmentId": "c3789484-2a1b-445e-8cea-65cd866bedc5",
          "userId": "beth"
        },
        {
          "createdAt": "2026-02-03T21:45:06.436Z",
          "updatedAt": "2026-02-03T21:45:06.436Z",
          "versionNumber": 1,
          "segmentId": "c3789484-2a1b-445e-8cea-65cd866bedc5",
          "userId": "darnell"
        },
        {
          "createdAt": "2026-02-03T21:45:06.436Z",
          "updatedAt": "2026-02-03T21:45:06.436Z",
          "versionNumber": 1,
          "segmentId": "c3789484-2a1b-445e-8cea-65cd866bedc5",
          "userId": "dave"
        }
      ],
      "groupForSegment": [],
      "subSegments": [],
      "experimentSegmentInclusion": null,
      "experimentSegmentExclusion": null
    },
    {
      "createdAt": "2026-02-03T21:45:17.344Z",
      "updatedAt": "2026-02-03T21:45:17.344Z",
      "versionNumber": 1,
      "id": "93c4d91c-6cc9-40c9-94bc-42ad5e1fdb3d",
      "name": "classes",
      "description": "",
      "listType": "classId",
      "context": "upgrade-internal",
      "type": "private",
      "tags": null,
      "individualForSegment": [],
      "groupForSegment": [
        {
          "createdAt": "2026-02-03T21:45:17.344Z",
          "updatedAt": "2026-02-03T21:45:17.344Z",
          "versionNumber": 1,
          "segmentId": "93c4d91c-6cc9-40c9-94bc-42ad5e1fdb3d",
          "groupId": "4uiu",
          "type": "classId"
        },
        {
          "createdAt": "2026-02-03T21:45:17.344Z",
          "updatedAt": "2026-02-03T21:45:17.344Z",
          "versionNumber": 1,
          "segmentId": "93c4d91c-6cc9-40c9-94bc-42ad5e1fdb3d",
          "groupId": "asdfasdf",
          "type": "classId"
        },
        {
          "createdAt": "2026-02-03T21:45:17.344Z",
          "updatedAt": "2026-02-03T21:45:17.344Z",
          "versionNumber": 1,
          "segmentId": "93c4d91c-6cc9-40c9-94bc-42ad5e1fdb3d",
          "groupId": "98372984",
          "type": "classId"
        }
      ],
      "subSegments": [],
      "experimentSegmentInclusion": null,
      "experimentSegmentExclusion": null
    },
    {
      "createdAt": "2026-02-03T21:46:03.790Z",
      "updatedAt": "2026-02-03T21:46:03.790Z",
      "versionNumber": 1,
      "id": "fad7a425-ed5f-4202-b948-2b6ecce352ff",
      "name": "my-nested-segment",
      "description": null,
      "listType": "Segment",
      "context": "upgrade-internal",
      "type": "private",
      "tags": null,
      "individualForSegment": [],
      "groupForSegment": [],
      "subSegments": [
        {
          "createdAt": "2026-02-03T21:45:34.054Z",
          "updatedAt": "2026-02-03T21:45:34.054Z",
          "versionNumber": 1,
          "id": "bf85888f-5233-43e5-a87a-6bf83de3bb99",
          "name": "my-nested-segment",
          "description": "",
          "listType": null,
          "context": "upgrade-internal",
          "type": "public",
          "tags": []
        }
      ],
      "experimentSegmentInclusion": null,
      "experimentSegmentExclusion": null
    }
  ]
}

```

**Example Segment JSON (Group-Based):**

```json
{
  "id": "seg23456-78ab-cdef-0123-456789abcdef",
  "name": "Premium Schools",
  "description": "Schools with premium subscription",
  "context": "school_app",
  "type": "public",
  "tags": ["premium"],
  "individualForSegment": [],
  "groupForSegment": [
    {
      "groupId": "school_001",
      "type": "school"
    },
    {
      "groupId": "school_002",
      "type": "school"
    }
  ],
  "subSegments": []
}
```

**Example Segment JSON (With Sub-Segments):**

```json
{
  "id": "seg34567-89ab-cdef-0123-456789abcdef",
  "name": "All Premium Users",
  "description": "Combined segment of all premium user groups",
  "context": "app",
  "type": "public",
  "tags": ["premium", "composite"],
  "individualForSegment": [],
  "groupForSegment": [],
  "subSegments": [
    "seg12345-67ab-cdef-0123-456789abcdef",
    "seg23456-78ab-cdef-0123-456789abcdef"
  ]
}
```

***
