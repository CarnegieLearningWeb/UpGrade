# TypeScript / JS

Please find the latest 4x version (4.1.7 at time of writing) at npm:\
\
[https://www.npmjs.com/package/upgrade\_client\_lib?activeTab=readme](https://www.npmjs.com/package/upgrade_client_lib?activeTab=readme)\
\
Importing client and types for browser or node:

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

