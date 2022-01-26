import random
import json
import requests

def getExperimentIds(protocol, host):
    url = protocol + f"://{host}/api/experiments/names"

    with requests.get(url) as response:
        if response.status_code != 200:
            print(f"Experiment ids Failed with {response.status_code}")
        else:
            print("Experiment ids found successfully")
            expIds = []
            for x in json.loads(response.content):
                # only grab experiments created for the locust tests
                if "LocustLoadTest" in x['name']:
                    expIds.append(x['id'])
            return expIds

def deleteExperiment(protocol, host, expIds):
        url = protocol + f"://{host}/api/experiments/"+random.choice(expIds)
        if expIds:
            with requests.delete(url) as response:
                if response.status_code != 200:
                    print(f"deleteExperiment Failed with {response.status_code}")
                else:
                    print("Experiment is deleted successfully")