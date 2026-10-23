# List

#### Lists

Under the hood, a "List" is private subsegment linked to another entity. These will follow the same import validation rules as segments.\
\
A list can also contain subsegments!

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

\
**Example List JSON:**

```json
{
  "createdAt": "2026-02-04T03:23:53.337Z",
  "updatedAt": "2026-02-04T03:23:53.337Z",
  "versionNumber": 1,
  "id": "a19ade2f-17df-42eb-b17c-c0002f50a5e0",
  "name": "classes",
  "description": "",
  "listType": "classId",
  "context": "upgrade-internal",
  "type": "private",
  "tags": null,
  "individualForSegment": [],
  "groupForSegment": [
    {
      "createdAt": "2026-02-04T03:23:53.337Z",
      "updatedAt": "2026-02-04T03:23:53.337Z",
      "versionNumber": 1,
      "segmentId": "a19ade2f-17df-42eb-b17c-c0002f50a5e0",
      "groupId": "98372984",
      "type": "classId"
    },
    {
      "createdAt": "2026-02-04T03:23:53.337Z",
      "updatedAt": "2026-02-04T03:23:53.337Z",
      "versionNumber": 1,
      "segmentId": "a19ade2f-17df-42eb-b17c-c0002f50a5e0",
      "groupId": "asdfasdf",
      "type": "classId"
    },
    {
      "createdAt": "2026-02-04T03:23:53.337Z",
      "updatedAt": "2026-02-04T03:23:53.337Z",
      "versionNumber": 1,
      "segmentId": "a19ade2f-17df-42eb-b17c-c0002f50a5e0",
      "groupId": "4uiu",
      "type": "classId"
    }
  ],
  "subSegments": [],
  "experimentSegmentInclusion": null,
  "experimentSegmentExclusion": null
}
```
