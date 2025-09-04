# JavaScript / TypeScript SDK for use with the Upgrade A/B Testing platform.
Please see https://upgrade-platform.gitbook.io/docs/developer-guide/reference/client-libraries/typescript-js for this and more documentation.

# UpGrade TypeScript Client Library

## Installation

Install the UpGrade client library using npm:

```bash
npm install upgrade_client_lib
```

## Import

The library provides different builds for different environments:

**For Browser environments:**
```typescript
import UpgradeClient from 'upgrade_client_lib/dist/browser';
```

**For Node.js environments:**
```typescript
import UpgradeClient from 'upgrade_client_lib/dist/node';
```

**Import with additional types:**
```typescript
import UpgradeClient, { Assignment, MARKED_DECISION_POINT_STATUS } from 'upgrade_client_lib/dist/browser';
```

## Essential Classes

### UpgradeClient

The `UpgradeClient` is the main class for interacting with the UpGrade API. It handles user initialization, experiment assignments, feature flags, and logging.

#### Constructor

```typescript
new UpgradeClient(userId: string, hostUrl: string, context: string, options?: IConfigOptions)
```

**Parameters:**
- `userId`: Unique identifier for the user
- `hostUrl`: URL of your UpGrade API server
- `context`: Context identifier for your application
- `options` (optional): Configuration options including:
  - `token`: Authorization token
  - `clientSessionId`: Custom session identifier
  - `featureFlagUserGroupsForSession`: Special configuration for feature flag group handling (see [Feature Flag Usage Modes](#feature-flag-usage-modes))

**Example:**
```typescript
const upgradeClient = new UpgradeClient(
  'user123',
  'https://my-upgrade-server.com',
  'my-app-context'
);
```

#### Key Methods

##### `init(group?, workingGroup?): Promise<IExperimentUser>`

Initializes the user and metadata. Must be called before using other methods.

**Parameters:**
- `group` (optional): Record of group memberships
- `workingGroup` (optional): Record of active working groups

**Example:**
```typescript
const group = {
  classId: ['class1', 'class2'],
  districtId: ['district1']
};

const workingGroup = {
  classId: 'class1',
  districtId: 'district1'
};

const user = await upgradeClient.init(group, workingGroup);
```

##### `getAllExperimentConditions(options?): Promise<IExperimentAssignmentv5[]>`

Retrieves all experiment assignments for the current context.

**Parameters:**
- `options.ignoreCache` (optional): If true, fetches fresh data from API instead of using cache

**Example:**
```typescript
const assignments = await upgradeClient.getAllExperimentConditions();
```

##### `getDecisionPointAssignment(site, target?): Promise<Assignment>`

Gets the assignment for a specific decision point.

**Parameters:**
- `site`: The site identifier
- `target` (optional): The target identifier within the site

**Example:**
```typescript
const assignment = await upgradeClient.getDecisionPointAssignment('dashboard', 'button');
```

##### `markDecisionPoint(site, target, condition?, status, uniquifier?, clientError?): Promise<IMarkDecisionPoint>`

Records that a user has encountered a decision point.

**Parameters:**
- `site`: The site identifier
- `target`: The target identifier
- `condition` (optional): The assigned condition
- `status`: Status of the condition application (from `MARKED_DECISION_POINT_STATUS` enum)
- `uniquifier` (optional): Unique identifier for linking metrics
- `clientError` (optional): Error message if condition failed to apply

**Example:**
```typescript
import { MARKED_DECISION_POINT_STATUS } from 'upgrade_client_lib/dist/browser';

await upgradeClient.markDecisionPoint(
  'dashboard',
  'button',
  'variant_a',
  MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED
);
```

## Feature Flag Usage Modes

**Important:** Feature flags work differently from experiments and have special configuration options that can eliminate the need to call `init()`.

The UpGrade client supports three different modes for feature flag evaluation:

### 1. Stored-user Mode (Standard)
- **Usage:** Omit `featureFlagUserGroupsForSession` configuration
- **Behavior:** Uses only stored user groups from the database  
- **Requirements:** User must be initialized with `init()` first, will return 404 if user does not exist
- **Best for:** Standard scenarios where users are pre-registered in the system

```typescript
// Standard mode - requires init()
const upgradeClient = new UpgradeClient('user123', 'https://api.com', 'context');
await upgradeClient.init();
const flags = await upgradeClient.getAllFeatureFlags();
```

### 2. Ephemeral Mode (Session-only groups)
- **Usage:** Set `includeStoredUserGroups: false` and provide `groupsForSession`
- **Behavior:** Uses only the groups provided in the session, ignoring stored user groups
- **Requirements:** **Does NOT require `init()` - bypasses stored user lookup entirely**
- **Best for:** When complete group information is always provided at runtime

```typescript
// Ephemeral mode - NO init() required!
const upgradeClient = new UpgradeClient('user123', 'https://api.com', 'context', {
  featureFlagUserGroupsForSession: {
    groupsForSession: { 
      classId: ['testClass'], 
      roleId: ['teacher'] 
    },
    includeStoredUserGroups: false
  }
});

// Can call feature flag methods directly without init()
const flags = await upgradeClient.getAllFeatureFlags();
const hasFlag = await upgradeClient.hasFeatureFlag('new-feature');
```

### 3. Merged Mode (Stored + Session groups)
- **Usage:** Set `includeStoredUserGroups: true` and provide `groupsForSession`
- **Behavior:** Session groups are merged with stored groups if they don't already exist for the user
- **Requirements:** User must be initialized with `init()` first, will return 404 if user does not exist
- **Best for:** Adding context-specific ephemeral groups to an existing user
- **Note:** Session groups are never persisted

```typescript
// Merged mode - requires init()
const upgradeClient = new UpgradeClient('user123', 'https://api.com', 'context', {
  featureFlagUserGroupsForSession: {
    groupsForSession: { 
      sessionId: ['current-session'] 
    },
    includeStoredUserGroups: true
  }
});

await upgradeClient.init();
const flags = await upgradeClient.getAllFeatureFlags();
```

### Dynamic Feature Flag Configuration

You can also change the feature flag mode after client creation:

```typescript
const upgradeClient = new UpgradeClient('user123', 'https://api.com', 'context');

// Switch to ephemeral mode
upgradeClient.setFeatureFlagUserGroupsForSession({
  groupsForSession: { classId: ['testClass'] },
  includeStoredUserGroups: false
});

// Now you can use feature flags without init()
const flags = await upgradeClient.getAllFeatureFlags();

// Switch back to standard mode
upgradeClient.setFeatureFlagUserGroupsForSession(null);
// Now init() is required again for feature flags
await upgradeClient.init();
```

### Feature Flag Methods

##### `getAllFeatureFlags(options?): Promise<string[]>`

Retrieves all feature flags for the user.

**Parameters:**
- `options.ignoreCache` (optional): If true, fetches fresh data from API

**Example:**
```typescript
const featureFlags = await upgradeClient.getAllFeatureFlags();
console.log(featureFlags); // ['feature1', 'feature2']
```

##### `hasFeatureFlag(key): Promise<boolean>`

Checks if a specific feature flag is enabled for the user.

**Example:**
```typescript
const isEnabled = await upgradeClient.hasFeatureFlag('new-dashboard');
```

##### `log(metrics): Promise<ILogResponse[]>`

Reports user outcome metrics to UpGrade.

**Example:**
```typescript
const metrics = [{
  userId: 'user123',
  timestamp: '2023-03-03T19:49:00.496Z',
  metrics: {
    attributes: {
      totalTimeSeconds: 300,
      tasksCompleted: 5
    },
    groupedMetrics: [{
      groupClass: 'session',
      groupKey: 'math-lesson-1',
      groupUniquifier: '2023-03-03T19:48:53.861Z',
      attributes: {
        timeSeconds: 120,
        correctAnswers: 8
      }
    }]
  }
}];

await upgradeClient.log(metrics);
```

### Assignment

The `Assignment` class represents an experiment assignment for a specific decision point. It provides access to assigned conditions, payloads, and factorial experiment data.

#### Properties

##### `getCondition(): string`

Returns the assigned condition code.

**Example:**
```typescript
const assignment = await upgradeClient.getDecisionPointAssignment('site', 'target');
const condition = assignment.getCondition(); // 'control' or 'treatment'
```

##### `getPayload(): IPayload | null`

Returns the payload associated with the assignment.

**Example:**
```typescript
const payload = assignment.getPayload();
if (payload) {
  console.log(payload.type); // 'string', 'number', 'boolean', etc.
  console.log(payload.value); // The actual payload value
}
```

##### `getExperimentType(): EXPERIMENT_TYPE`

Returns the type of experiment (e.g., 'Simple', 'Factorial').

**Example:**
```typescript
const experimentType = assignment.getExperimentType();
```

#### Factorial Experiment Methods

For factorial experiments, the Assignment class provides additional methods:

##### `factors: string[]`

Returns an array of factor names (only for factorial experiments).

**Example:**
```typescript
const factors = assignment.factors; // ['color', 'size']
```

##### `getFactorLevel(factor): string`

Returns the level assigned for a specific factor.

**Example:**
```typescript
const colorLevel = assignment.getFactorLevel('color'); // 'red' or 'blue'
```

##### `getFactorPayload(factor): IPayload | null`

Returns the payload for a specific factor.

**Example:**
```typescript
const colorPayload = assignment.getFactorPayload('color');
```

#### Marking Decision Points

##### `markDecisionPoint(status, uniquifier?, clientError?): Promise<IMarkDecisionPoint>`

Records that the user encountered this assignment's decision point.

**Example:**
```typescript
import { MARKED_DECISION_POINT_STATUS } from 'upgrade_client_lib/dist/browser';

const assignment = await upgradeClient.getDecisionPointAssignment('site', 'target');
await assignment.markDecisionPoint(MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED);
```

## Status Enums

The `MARKED_DECISION_POINT_STATUS` enum defines the possible statuses when marking decision points:

- `CONDITION_APPLIED`: The condition was successfully applied
- `CONDITION_FAILED_TO_APPLY`: The condition could not be applied
- `NO_CONDITION_ASSIGNED`: No condition was assigned

## Usage Workflow

### For Experiments
A typical experiment workflow with the UpGrade client follows these steps:

1. **Initialize the client** with user, host, and context information
2. **Initialize the user** to register them with the UpGrade system (always required for experiments)
3. **Get experiment assignments** to determine what conditions the user should see
4. **Apply conditions** in your application logic
5. **Mark decision points** to record that the user encountered the experimental conditions
6. **Log metrics** to track user outcomes and measure experiment success

### For Feature Flags
Feature flag workflow can be simpler and has multiple options:

**Option 1: Standard Mode (requires init)**
1. Initialize client → Call `init()` → Use feature flag methods

**Option 2: Ephemeral Mode (no init required)**
1. Initialize client with `featureFlagUserGroupsForSession` → Directly use feature flag methods

See [Feature Flag Usage Modes](#feature-flag-usage-modes) for detailed configuration options.

**Complete Example:**
```typescript
import UpgradeClient, { MARKED_DECISION_POINT_STATUS } from 'upgrade_client_lib/dist/browser';

// 1. Initialize client
const upgradeClient = new UpgradeClient(
  'user123',
  'https://my-upgrade-server.com',
  'my-app'
);

// 2. Initialize user
await upgradeClient.init();

// 3. Get assignment for a decision point
const assignment = await upgradeClient.getDecisionPointAssignment('dashboard', 'header-color');

// 4. Apply the condition
const condition = assignment.getCondition();
if (condition === 'blue-header') {
  // Apply blue header styling
} else {
  // Apply default header styling
}

// 5. Mark that we've shown the condition
await assignment.markDecisionPoint(MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED);

// 6. Later, log user outcomes
const metrics = [{
  userId: 'user123',
  timestamp: new Date().toISOString(),
  metrics: {
    attributes: {
      buttonClicks: 5,
      timeOnPage: 120
    }
  }
}];

await upgradeClient.log(metrics);
```