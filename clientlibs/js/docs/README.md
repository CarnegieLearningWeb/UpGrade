## JavaScript / TypeScript SDK for use with the Upgrade A/B Testing platform.

# Please see https://upgrade-platform.gitbook.io/docs/developer-guide/reference/client-libraries/typescript-js for the technical specs.

# Installation

```typescript
import UpgradeClient from 'upgrade_client_lib/dist/browser';
```

```typescript
import UpgradeClient from 'upgrade_client_lib/dist/node';
```

General UpGrade types can also be accessed as named exports:
```typescript
import UpgradeClient, { IExperimentAssignment } from 'upgrade_client_lib/dist/browser';
```

SDK-Specific types can be accessed also:
```typescript
import { Interfaces } from 'upgrade_client_lib/dist/clientlibs/js/src/identifiers';

const initResponse: Interfaces.IUser = await upgradeClient.init();
```
