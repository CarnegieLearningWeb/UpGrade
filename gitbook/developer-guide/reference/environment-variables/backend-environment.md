---
description: Details for Backend Configuration
---

# Backend Environment

Assume most variables are required unless noted otherwise; see sample [`.env.example`](https://github.com/CarnegieLearningWeb/UpGrade/blob/main/backend/packages/Upgrade/.env.example) for sample usage in order to create a local `.env` file.

{% hint style="info" %}
`.env` will need to be created for running backend locally (if not using [local Docker workflow](/broken/pages/-Mg61xfUO7xJKtKCy5y0)). Note that this will not be included in build or git history. You will need to configure EV in your host environment.\
\
If using Docker workflow for local development, you will want to make sure to set your local env vars in [`.env.local.docker`](https://github.com/CarnegieLearningWeb/UpGrade/blob/main/backend/packages/Upgrade/.env.docker.local)
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
| **CACHING\_ENABLED**   | Enable cached query calls (current applies to GET /segments queries)                     | boolean (default: FALSE) | TRUE          |
| **CORS\_WHITELIST**    | domains to allow to bypass cross-domain restrictions                                     | array of strings         | localhost     |



**Logging**

| Variable        | Description                  | Allowed Values                                                           | Example |
| --------------- | ---------------------------- | ------------------------------------------------------------------------ | ------- |
| **LOG\_LEVEL**  | Log level for Winston logger | "error" \| "warn" \| "info" \| "http" \| "verbose" \| "debug" \| "silly" | "debug" |
| **LOG\_OUTPUT** | log output                   | "dev" or empty                                                           | "dev"   |



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
| **TYPEORM\_MAX\_CONNECTION\_POOL\_SIZE**                  | Maximum number of db connections to postgres                                                                                                                                 | string                                                                     | 20 (defaults to 10)                          |

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
| **SWAGGER\_API**     | Code path for swagger API source                                                           | string         | src/api/controllers/\*.ts |



**Authorization Config**

<table><thead><tr><th width="183.25">Variable</th><th>Description</th><th>Allowed Values</th><th>Example</th></tr></thead><tbody><tr><td><strong>GOOGLE_CLIENT_ID</strong></td><td>Google Client Id credential provided from Google Cloud Console</td><td>string or comman separated strings for multiple</td><td>&#x3C;id>.apps.googleusercontent.com</td></tr><tr><td><strong>DOMAIN_NAME</strong></td><td>Limit Google-auth JWT credential token to be granted only user logins from a specific email domain (blank will allow all domains)</td><td>string</td><td>yourDomain.com</td></tr><tr><td><strong>GOOGLE_SERVICE_ACCOUNT_ID</strong></td><td>Google Service Account key</td><td>string or comman separated strings for multiple</td><td>xxxxxxxxxx</td></tr></tbody></table>



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
| **EMAIL\_FROM**                   | Addess that email will be sent from           | string         | dev@playpowerlabs.com |
| **EMAIL\_EXPIRE\_AFTER\_SECONDS** | Milliseconds to retain availability of email  | string         | 36000                 |
| **EMAIL\_BUCKET**                 | S3 email bucket name deployed on aws          | string         | "upgrade-csv-upload"  |



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
