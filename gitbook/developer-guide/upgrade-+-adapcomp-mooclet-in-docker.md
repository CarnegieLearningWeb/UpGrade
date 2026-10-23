---
icon: bolt-lightning
---

# UpGrade + AdapComp (Mooclet) in Docker

## Using Upgrade with Mooclet-Engine Django API

You will need `docker` and `docker-compose`. I recommend using the docker UI app once you have it launched the first time.

### Clone the mooclet-engine project from the open source fork here:

[https://github.com/Simon-Initiative/mooclet-engine/tree/feature/dockerized-local-mooclet-engine](https://github.com/Simon-Initiative/mooclet-engine/tree/feature/dockerized-local-mooclet-engine)

```bash
# https
git clone https://github.com/Simon-Initiative/mooclet-engine.git

# ssh
git clone git@github.com:Simon-Initiative/mooclet-engine.git
```

### Switch to my branch with dockerized local setup:

```bash
cd mooclet-engine
git checkout feature/dockerized-local-mooclet-engine
```

### Create a `docker_local.env`

```bash
cp docker_local.env.example docker_local.env
```

no modification should be necessary, but this is where to fiddle with your specific docker config needs if necessary

### Create a `secure.py` file

```bash
cp secure.py.example mooclet_engine/mooclet_engine/settings/secure.py
```

Note: uncomment the line with `SECRET_KEY` in your `secure.py` and replace the value with some valid string (for this dev server any string is fine, but you can google how to get a proper key if you want)

### Modify the PostGres port in `docker_local.docker-compose.yml` to avoid port conflict (optional, but probably necessary)

If running UpGrade backend, port `5432` will conflict as the postgres default port. The quick modification to allow running both is to change `ports` value in `docker_local.docker-compose.yml` from `5432:5432` to `5433:5432` like so:

![image](https://github.com/user-attachments/assets/ebed2ef0-27e0-49f8-b20e-f33f620961f4)

### Launch the container

```bash
cd mooclet_engine # you will run this from the dir of the docker compose file (mooclet-engine/mooclet_engine notice the sneaky hyphen and underscore!)

docker-compose -f docker_local.docker-compose.yml --env-file ./docker_local.env up --build
```

If that is successful, you will see this in the mooclet-api logs, this is the API up and ready for business:

```
Generated token <some-token> for user mooclet_admin
Watching for file changes with StatReloader
```

### Use the generated API token in upgrade `.env`

Plunk that token in your Upgrade `.env` file for `MOOCLETS_API_TOKEN`. If you don't have the other values your env, you will need these, they will not need modified:

![image](https://github.com/user-attachments/assets/b1d1bb89-9107-4fe3-868e-8e482a8edd63)

Note also that if UpGrade is also running in a container, you will need to modify `MOOCLETS_HOST_URL` as well to help docker map to it's internal "localhost":

`MOOCLETS_HOST_URL=http://host.docker.internal:8000/`

### Test it out

Launch/restart UpGrade. If both applications can start up, you should be able to test out the connection by sending this via postman request. This will use UpGrade's API to proxy a call to Mooclet API (may likely need to set the Upgrade Authorization Bearer token). If success, you're up and running. 🎉

`POST http://localhost:3030/api/experiments`

```json
{
    "name": "Fuchsia Chinchilla 7",
    "description": "",
    "consistencyRule": "individual",
    "assignmentUnit": "individual",
    "type": "Simple",
    "context": [
        "mathstream"
    ],
    "assignmentAlgorithm": "ts_configurable",
    "stratificationFactor": null,
    "tags": [],
    "conditions": [
        {
            "id": "f55c8e10-0d7d-4970-a8dd-63c46c42b5e4",
            "conditionCode": "question-hint-default",
            "assignmentWeight": 50,
            "description": null,
            "order": 1,
            "name": ""
        },
        {
            "id": "11b02266-34f5-4982-882d-31adde41f482",
            "conditionCode": "question-hint-tutorbot",
            "assignmentWeight": 50,
            "description": null,
            "order": 2,
            "name": ""
        }
    ],
    "conditionPayloads": [
        {
            "id": "d3bfd2ce-7791-4653-8d12-2e7a944684fa",
            "payload": {
                "type": "string",
                "value": "question-hint-default"
            },
            "parentCondition": "f55c8e10-0d7d-4970-a8dd-63c46c42b5e4",
            "decisionPoint": "e15debc0-7557-48d8-95bf-5bdb1eeae6ea"
        },
        {
            "id": "51403d90-ab29-4293-b1ce-67e1f62da5d2",
            "payload": {
                "type": "string",
                "value": "question-hint-tutorbot"
            },
            "parentCondition": "f55c8e10-0d7d-4970-a8dd-63c46c42b5e4",
            "decisionPoint": "e15debc0-7557-48d8-95bf-5bdb1eeae6ea"
        }
    ],
    "partitions": [
        {
            "id": "e15debc0-7557-48d8-95bf-5bdb1eeae6ea",
            "site": "lesson-stream",
            "target": "question-hint",
            "description": "",
            "order": 1,
            "excludeIfReached": false
        }
    ],
    "experimentSegmentInclusion": {
        "segment": {
            "individualForSegment": [],
            "groupForSegment": [
                {
                    "type": "All",
                    "groupId": "All"
                }
            ],
            "subSegments": [],
            "type": "private"
        }
    },
    "experimentSegmentExclusion": {
        "segment": {
            "individualForSegment": [],
            "groupForSegment": [],
            "subSegments": [],
            "type": "private"
        }
    },
    "filterMode": "includeAll",
    "queries": [],
    "endOn": null,
    "enrollmentCompleteCondition": null,
    "startOn": null,
    "state": "inactive",
    "postExperimentRule": "continue",
    "revertTo": null,
    "moocletPolicyParameters": {
        "assignmentAlgorithm": "ts_configurable",
        "prior": {
            "success": 1,
            "failure": 1
        },
        "batch_size": 1,
        "max_rating": 1,
        "min_rating": 0,
        "uniform_threshold": 0,
        "tspostdiff_thresh": 0,
        "outcome_variable_name": "TS_CONFIG_Fuchsia Chinchilla 7"
    }
}
```
