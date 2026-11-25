---
description: Notes on frontend config options
---

# Frontend Environment

The frontend is configured at build time by a TypeScript file in `packages/frontend/projects/upgrade/src/environments/`, one per target environment (`environment.ts`, `environment.local.ts`, `environment.qa.ts`, `environment.staging.ts`, `environment.prod.ts`, and so on). The shape of each is enforced by the `Environment` interface in `environment-types.ts`, so all of them carry the same set of fields.

For local development, copy `environment.local.example.ts` to `environment.local.ts` and edit it:

```typescript
import { Environment } from './environment-types';

export const environment: Environment = {
  // name it whatever you like
  appName: 'UpGrade',
  // envName isn't currently used
  envName: 'DEV',
  // your backend service api domain
  apiBaseUrl: 'http://localhost:3030/api',
  // use production: true to quiet dev console messages
  production: false,
  // this also quiets debug messages, leave as is
  test: false,
  // configure baseHref if needed by server routing
  baseHrefPrefix: '',
  // configure hash routing if needed by server routing
  useHashRouting: false,
  // this is important! see the google client id page, must match the id in backend env
  googleClientId: 'replace-me-with-same-google-client-id-as-backend-env',
  // can be used to restrict domains of users logging in on client
  domainName: '',
  // allow within-subjects feature
  withinSubjectExperimentSupportToggle: false,
  // allow error logs feature
  errorLogsToggle: false,
  // show metrics graphs in data page
  metricAnalyticsExperimentDisplayToggle: true,
};
```

| Field                                        | Description                                                                             | Type    |
| -------------------------------------------- | ----------------------------------------------------------------------------------------- | ------- |
| **appName**                                  | Display name for the application                                                        | string  |
| **envName**                                  | Environment label                                                                       | string  |
| **apiBaseUrl**                               | Base URL of the backend API, including the route prefix                                 | string  |
| **production**                               | Angular production mode. Quiets dev console messages                                    | boolean |
| **test**                                     | Quiets debug messages. Leave as is                                                      | boolean |
| **baseHrefPrefix**                           | Base href, if needed by server routing                                                  | string  |
| **useHashRouting**                           | Use hash-based routing, if needed by server routing                                     | boolean |
| **googleClientId**                           | Google client ID. Must match `GOOGLE_CLIENT_ID` in the backend environment              | string  |
| **domainName**                               | Restrict login to a single email domain. Blank allows all domains                        | string  |
| **withinSubjectExperimentSupportToggle**     | Show the within-subjects experiment feature                                             | boolean |
| **errorLogsToggle**                          | Show the error logs feature                                                             | boolean |
| **metricAnalyticsExperimentDisplayToggle**   | Show metrics graphs on the data page                                                    | boolean |

{% hint style="info" %}
`pollingEnabled`, `pollingInterval` and `pollingLimit` have been removed. They remain optional on the `Environment` interface so that switching between branches doesn't break the build, but nothing reads them.
{% endhint %}

### Deployed environments

The included angular frontend environment files are set up for generic qa/staging/production builds so that a cicd process can substitute certain values at build time. This is a convenience/suggestion but not a requirement, it may not suit your deployments and could just as well be hardcoded if you have forked private repository. Here is how it works if you'd like to do it the way we do for our builds:

```typescript
apiBaseUrl: '%API_BASE_URL%',
baseHrefPrefix: '%BASE_HREF_PREFIX%',
googleClientId: '%GOOGLE_CLIENT_ID%',
```

`packages/frontend/set_build_variables.js` runs as the `prebuild:project` step and replaces each `%TOKEN%` with the matching value from `settings.env.js`, which reads it from the process environment:

| Variable               | Replaces             |
| ---------------------- | -------------------- |
| **API\_BASE\_URL**     | `%API_BASE_URL%`     |
| **BASE\_HREF\_PREFIX** | `%BASE_HREF_PREFIX%` |
| **GOOGLE\_CLIENT\_ID** | `%GOOGLE_CLIENT_ID%` |

The `ENV` variable selects which environment file is targeted for substitution, defaulting to `qa`.
