---
title: ENVS
---

Admin user

```
# modify this line, note the syntax for adding multiple users and roles
ADMIN_USERS=user@email:admin/\user2@email:admin

# add yourself
ADMIN_USERS=you@yourcompany:admin
```

\
UpGrade will start up with certain users automatically added as admin roles. You will want to put your email address in so that after login, you will have all permissions for your user in the UI.\
\
You will know if this is set correctly if you are able to see the "Add Experiment" and "Import Experiment" buttons on startup. If they are missing, it means you are a "reader" role, check this env var.

**CORS whitelist**

Ensure that this line is present in your env

```
CORS_WHITELIST=localhost
```

**Google Client Id:**\
\
Obtain a google client id and plunk it here ([follow this guide](../../developer-guide/reference/setting-up-google-auth.md))

```
GOOGLE_CLIENT_ID: xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
```

This id will also need to be supplied in `frontend/projects/upgrade/src/app/environments/environment.ts`

Note: There is a `DOMAIN` env variable below this. If you want to restrict your user logins to your org's email domain, replace the value here with that domain. Otherwise, it should be left blank.\
\
See other backend env option documentation [here](../../developer-guide/reference/environment-variables/).\
\
**Frontend:**\
\
Make a copy of `environment.local.example.ts`&#x20;

```
cd ../../../frontend/projects/upgrade/src/environments

# note that this one is not a dot file
cp environment.local.example.ts environment.local.ts
```

Put the google client id from about into the field: \`googleClientId\`

```typescript
googleClientId: xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
```

See other frontend env option documentation [here](../../developer-guide/reference/environment-variables/).<br>

See [this page](#environment-setup) for other environment options.
