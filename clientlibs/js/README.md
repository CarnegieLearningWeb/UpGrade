# upgrade_client_lib

JavaScript / TypeScript client library for the [UpGrade](https://upgrade-platform.gitbook.io/upgrade-documentation/6.4/developer-guide/reference/client-libraries/typescript-js) A/B testing platform.

## Installation

```bash
npm install upgrade_client_lib
```

## Quickstart

```typescript
import { UpgradeClient, MARKED_DECISION_POINT_STATUS } from 'upgrade_client_lib';

// 1. Construct the client
const client = new UpgradeClient(
  'user123',               // unique user ID
  'https://your-upgrade-server.com',
  'your-app-context'
);
const decisionPoint = { site: 'homepage', target: 'feature-to-be-tested' };

// 2. Initialize the user
await client.init();

// 3. Get an assignment when user hits the "homepage/feature-to-be-tested"
const assignment = await client.getDecisionPointAssignment(decisionPoint.site, decisionPoint.target);
const condition = assignment.getPayload().value; // e.g. 'control' or 'variant'

// 4. Use the condition at the point in user experience when needed
if (condition === "control") // use the control flow
if (condition === "variant") // use the variant flow

// 5. Mark that the user passed through the decision point to track or officially enroll the user
await client.markDecisionPoint(decisionPoint.site, decisionPoint.target, condition, MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED);

## Documentation

For full API reference, feature flags, logging metrics, and advanced configuration, see the [UpGrade TypeScript/JS client library docs](https://upgrade-platform.gitbook.io/upgrade-documentation/6.4/developer-guide/reference/client-libraries/typescript-js).
