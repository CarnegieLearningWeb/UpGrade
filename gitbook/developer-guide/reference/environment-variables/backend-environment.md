---
description: Details for Backend Configuration
---

# Backend Environment

Assume most variables are required unless noted otherwise; see sample [`.env.example`](https://github.com/CarnegieLearningWeb/UpGrade/blob/main/packages/backend/.env.example) for sample usage in order to create a local `.env` file.

{% hint style="info" %}
`.env` will need to be created for running backend locally (if not using [local Docker workflow](../../quick-start-running-upgrade-with-docker-on-macos-or-linux.md)). Note that this will not be included in build or git history. You will need to configure EV in your host environment.\
\
If using Docker workflow for local development, you will want to make sure to set your local env vars in [`.env.docker.local`](https://github.com/CarnegieLearningWeb/UpGrade/blob/main/packages/backend/.env.docker.local.example)
{% endhint %}

\
**Application Level**

| Variable               | Description                                                                              | Allowed Values           | Example       |
| ---------------------- | ---------------------------------------------------------------------------------------- | ------------------------ | ------------- |
| **APP\_NAME**          | Name for the application                                                                 | string                   | "A/B Testing" |
| **APP\_SCHEMA**        | Protocol for local server                                                                | "http" or "https"        | "http"        |
| **APP\_PORT**          | Port number to the backend application                                                   | string                   | "3030"        |
| **APP\_HOST**          | Domain to be used in Upgrade local codebase                                              | string                   | "localhost"   |
| **APP\_ROUTE\_PREFIX** | API route prefix                                                                         | "/" + url safe string    | "/api"        |
| **APP\_BANNER**        | console log the basic info of the application as a banner log                            | boolean                  | TRUE          |
| **APP\_DEMO**          | deploy as demo-supporting backend. Additionally, gives access to clear DB via "/clearDB" | boolean (default: false) | FALSE         |
| **CORS\_WHITELIST**    | domains to allow to bypass cross-domain restrictions                                     | array of strings         | localhost     |
| **USE\_NEW\_RELIC**    | Enable New Relic APM instrumentation                                                     | boolean (default: false) | FALSE         |
| **IS\_ECS**            | Marks the process as running under AWS ECS. Optional; not present in `.env.example`      | boolean (default: false) | FALSE         |
| **PERF\_DIAG\_ENABLED** | Enable temporary request performance diagnostics. Optional; not present in `.env.example` | boolean (default: false) | FALSE        |



**Caching**

Caching is in-memory and per-process. TTLs are in **seconds**. The four per-category TTLs each fall back to `CACHING_TTL` when unset, and `CACHING_TTL` itself falls back to 900 seconds when unset or 0.

| Variable                        | Description                                                                                                                             | Allowed Values            | Example |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------- |
| **CACHING\_ENABLED**            | Enable cached query calls. Applies to experiment, feature flag, segment and setting lookups on the assignment path                       | boolean (default: FALSE)  | TRUE    |
| **CACHING\_TTL**                | Default time-to-live for a cached entry, in seconds                                                                                     | number (default: 900)     | 10      |
| **CACHING\_MAX\_KEYS**          | Maximum number of entries held in the cache before eviction                                                                             | number (default: 500)     | 500     |
| **CACHING\_TTL\_EXPERIMENTS**   | TTL override for experiment lookups, in seconds                                                                                         | number (optional)         | 60      |
| **CACHING\_TTL\_FEATURE\_FLAGS** | TTL override for feature flag lookups, in seconds                                                                                      | number (optional)         | 60      |
| **CACHING\_TTL\_SEGMENTS**      | TTL override for segment lookups, in seconds                                                                                            | number (optional)         | 60      |
| **CACHING\_TTL\_SETTINGS**      | TTL override for settings lookups, in seconds                                                                                           | number (optional)         | 60      |
| **CACHING\_REFRESH\_THRESHOLD** | Refresh an entry in the background when it comes within this many seconds of expiring, so it never hard-expires. 0 or unset disables it | number (default: 0)       | 30      |



**Logging**

| Variable           | Description                                                                              | Allowed Values                                                           | Example |
| ------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------- |
| **LOG\_LEVEL**     | Log level for Winston logger                                                             | "error" \| "warn" \| "info" \| "http" \| "verbose" \| "debug" \| "silly" | "debug" |
| **LOG\_OUTPUT**    | log output                                                                               | "dev" or empty                                                           | "dev"   |
| **LOG\_JSON**      | Emit logs as JSON rather than human-readable lines. Optional; not present in `.env.example` | boolean                                                                  | TRUE    |
| **SPLUNK\_HOST**   | Splunk HEC host for direct console log forwarding. Optional; not present in `.env.example` | string                                                                   | "splunk.example.com" |
| **SPLUNK\_TOKEN**  | Splunk HEC token. Optional; not present in `.env.example`                                | string                                                                   | xxxxxxxx |
| **SPLUNK\_INDEX**  | Splunk index to write to. Optional; not present in `.env.example`                        | string                                                                   | "upgrade" |



**TYPEORM + POSTGRES CONFIG**

| Variable                                                  | Description                                                                                                                                                                  | Allowed Values                                                             | Example                                      |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------- |
| **TYPEORM\_CONNECTION**                                   | Name for TypeORM connection to DB                                                                                                                                            | string                                                                     | "postgres"                                   |
| **TYPEORM\_HOST** (RDS\_HOSTNAME)                         | <p>TypeORM connection domain to be used in Upgrade local codebase<br><br>Replace with <strong>RDS_HOSTNAME</strong> if deployed in AWS</p>                                   | string                                                                     | "localhost"                                  |
| **TYPEORM\_HOSTNAME\_REPLICAS** (RDS\_HOSTNAME\_REPLICAS) | <p>TypeORM connection domains for any read-replica DB to be used in Upgrade local codebase<br><br>Replace with <strong>RDS_HOSTNAME_REPLICAS</strong> if deployed in AWS</p> | array of strings                                                           | \[ "localhost1", "localhost2", "localhost3"] |
| **TYPEORM\_PORT** (RDS\_PORT)                             | Port to be used for connection                                                                                                                                               | string                                                                     | "5432"                                       |
| **TYPEORM\_USERNAME** (RDS\_USERNAME)                     | Connection username                                                                                                                                                          | string                                                                     | "postgres"                                   |
| **TYPEORM\_PASSWORD** (RDS\_PASSWORD)                     | Connection password                                                                                                                                                          | string                                                                     | "postgres"                                   |
| **TYPEORM\_DATABASE** (RDS\_DB\_NAME)                     | Name of database driver                                                                                                                                                      | string                                                                     | "postgres"                                   |
| **TYPEORM\_SYNCHRONIZE**                                  | Whether TypeORM models will synchronize with DB at startup                                                                                                                   | boolean                                                                    | FALSE                                        |
| **TYPEORM\_LOGGING**                                      | Log level for db queries                                                                                                                                                     | "query" \| "schema" \| "error" \| "warn" \| "info" \| "log" \| "migration" | "error"                                      |
| **TYPEORM\_MAX\_QUERY\_EXECUTION\_TIME**                  | Number of milliseconds before TypeORM will log a "slow query" message. (Note: this does not timeout a query)                                                                 | string                                                                     | 1000                                         |
| **TYPEORM\_LOGGER**                                       | Which TypeORM logger implementation to use                                                                                                                                   | "advanced-console" \| "simple-console" \| "file" \| "debug"                | "advanced-console"                           |

\
**POSTGRES CONNECTION POOL**

These are passed straight through to the `pg` connection pool, and this process may create more than one pool. Leaving a value unset keeps `pg`'s own default: max 10, min 0, idle timeout 10 seconds, keepalive off, max lifetime never.

| Variable                                           | Description                                                                                                                                                              | Allowed Values         | Example             |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------- |
| **TYPEORM\_MAX\_CONNECTION\_POOL\_SIZE**           | Maximum number of db connections to postgres                                                                                                                             | number (default: 10)   | 20                  |
| **TYPEORM\_MIN\_CONNECTION\_POOL\_SIZE**           | The pool will not close an idle connection while it holds this many or fewer, regardless of the idle timeout. It does not open connections in advance                     | number (default: 0)    | 2                   |
| **TYPEORM\_IDLE\_TIMEOUT\_SECONDS**                | Close a pooled connection once it has sat idle this long. 0 means idle connections are never closed                                                                      | number (default: 10)   | 30                  |
| **TYPEORM\_MAX\_LIFETIME\_SECONDS**                | Close a connection this long after it was opened, so long-lived connections eventually reconnect and pick up DNS changes. Unset or 0 means never; keep it long if set    | number (default: 0)    | 3600                |
| **TYPEORM\_KEEP\_ALIVE**                           | Enable TCP keepalive on each connection's socket, so a NAT gateway or load balancer doesn't silently drop an idle pooled connection                                      | boolean (default: off) | TRUE                |
| **TYPEORM\_KEEP\_ALIVE\_INITIAL\_DELAY\_SECONDS**  | How long a socket sits idle before the first keepalive probe. Ignored unless keepalive is on. Unset leaves the OS default, which on Linux is 2 hours                      | number                 | 120                 |

\
**PATH STRUCTURE FOR TYPEORM**&#x20;

| Variable                     | Description                           | Allowed Values | Example                                    |
| ---------------------------- | ------------------------------------- | -------------- | ------------------------------------------ |
| **TYPEORM\_MIGRATIONS**      | Path for all migration files to apply | string         | src/database/migrations/\*\*/\*.ts         |
| **TYPEORM\_MIGRATIONS\_DIR** | Path for migration root directory     | string         | src/database/migrations                    |
| **TYPEORM\_ENTITIES**        | Path for all entity models.           | string         | src/api/models/\*\*/\*.ts                  |
| **TYPEORM\_ENTITIES\_DIR**   | Path for entities root directory      | string         | src/api/models                             |
| **CONTROLLERS**              | Path for controllers                  | string         | src/api/controllers/\*\*/\*Controller.ts   |
| **MIDDLEWARES**              | Path for middlewares                  | string         | src/api/middlewares/\*\*/\*Middleware.ts   |
| **INTERCEPTORS**             | Path for interceptors.                | string         | src/api/interceptors/\*\*/\*Interceptor.ts |
| **TYPEORM\_SEED**            | Path for seeding data files           | string         | src/database/seeds/\*\*/\*.seed.ts         |
| **TYPEORM\_FACTORY**         | Path for factories                    | string         | src/database/factories/\*\*/\*.factory.ts  |

\
**SWAGGER**

| Variable             | Description                                                                                | Allowed Values | Example                   |
| -------------------- | ------------------------------------------------------------------------------------------ | -------------- | ------------------------- |
| **SWAGGER\_ENABLED** | Enables generation of swagger API docs output. (If not needed, build is faster when FALSE) | boolean        | FALSE                     |
| **SWAGGER\_ROUTE**   | URL endpoint to access swagger docs (host + SWAGGER\_ROUTE)                                | string         | /swagger                  |
| **SWAGGER\_API**     | Code path for swagger API source                                                           | string         | \*\*/controllers/\*.ts    |
| **SWAGGER\_JSON**    | URL endpoint serving the generated swagger.json (host + SWAGGER\_JSON)                     | string         | /swagger.json             |



**Authorization Config**

<table><thead><tr><th width="183.25">Variable</th><th>Description</th><th>Allowed Values</th><th>Example</th></tr></thead><tbody><tr><td><strong>GOOGLE_AUTH_TOKEN_REQUIRED</strong></td><td>Require a Google auth token on admin API requests</td><td>boolean (default: false)</td><td>false</td></tr><tr><td><strong>GOOGLE_CLIENT_ID</strong></td><td>Google Client Id credential provided from Google Cloud Console</td><td>string or comma separated strings for multiple</td><td>&#x3C;id>.apps.googleusercontent.com</td></tr><tr><td><strong>DOMAIN_NAME</strong></td><td>Limit Google-auth JWT credential token to be granted only user logins from a specific email domain (blank will allow all domains)</td><td>string</td><td>yourDomain.com</td></tr><tr><td><strong>GOOGLE_SERVICE_ACCOUNT_ID</strong></td><td>Google Service Account key</td><td>string or comma separated strings for multiple</td><td>xxxxxxxxxx</td></tr></tbody></table>



**AWS Configs**

| Variable                                       | Description                                                                                   | Allowed Values          | Example                                                                                     |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------- |
| **SCHEDULER\_STEP\_FUNCTION**                  | The arn value of the Schedular step function deployed in aws                                  | string                  | arn:aws:states:us-east-1:781188149671:stateMachine:development-upgrade-experiment-schedular |
| **AWS\_REGION**                                | AWS region for backend and frontend resource deployments                                      | Valid AWS Region string | "us-east-1"                                                                                 |
| **HOST\_URL**                                  | AWS deployed backend endpoint url                                                             | string                  | "http://development-upgrade-experiment-app.eba-gp6psjut.us-east-1.elasticbeanstalk.com/api" |
| **TOKEN\_SECRET\_KEY**                         | Secret key shared with Scheduler Lambda function to decode JWT authorization token in request | string                  | carnegielearning                                                                            |
| **ALLOW\_SERVICE\_ACCOUNT\_TOKEN\_SERVICE**    | Allow token granting endpoint \`/token\`                                                      | boolean                 | false                                                                                       |
| **GOOGLE\_SERVICE\_ACCOUNT\_CREDENTIAL\_FILE** | Path to service credential on server if allowed above                                         | string path             | /path/to/credential.json                                                                    |



**Email Config**

| Variable                          | Description                                   | Allowed Values | Example               |
| --------------------------------- | --------------------------------------------- | -------------- | --------------------- |
| **EMAIL\_FROM**                   | Address that email will be sent from          | string         | dev@playpowerlabs.com |
| **EMAIL\_EXPIRE\_AFTER\_SECONDS** | Seconds to retain availability of email       | number         | 36000                 |
| **EMAIL\_BUCKET**                 | S3 email bucket name deployed on aws          | string         | "upgrade-csv-upload"  |
| **EMAIL\_TMP\_WRITEABLE\_FILE\_PATH** | Writeable path used to stage export files before upload. Optional | string path | "src/api/assets/files/" |



**Initialization**

| Variable                | Description                                                                                                  | Allowed Values                                                                                  | Example                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **ADMIN\_USERS**        | Email addresses that will be inserted as users with "admin" or other role automatically in this environment  | string list of email addresses, with ":" followed be "admin" or other role. delimited by "/\\"  | "user1@email.com:admin/\user2@email.com:admin/\user3@email.com:creator" |
| **CLIENT\_API\_SECRET** | Secret value shared with Client Library function to verify JWT authorization token payload in request        | string                                                                                          | "api-token-secret"                                                      |
| **CLIENT\_API\_KEY**    | Secret key shared with Client Library function to decode JWT authorization token in request                  | string                                                                                          | "api-token-key"                                                         |

\
**CONTEXT\_METADATA**

| Variable              | Description                                                                                                         | Allowed Values                                                                  | Example                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **CONTEXT\_METADATA** | Describes valid references to technical values from client platforms that will be connected to UpGrade experiments. | [Please see CONTEXT\_METADATA article for full details](../context-metadata.md) | [Please see CONTEXT\_METADATA article for full details](../context-metadata.md) |

**METRICS**

| Variable    | Description                                                                                                      | Allowed Values                                               | Example                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| **METRICS** | Describes valid references to outcomes data from client platforms that will be connected to UpGrade experiments. | [Please see METRICS article for full details](../metrics.md) | [Please see METRICS article for full details](../metrics.md) |

\
<br>

<br>
