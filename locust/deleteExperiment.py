import random
import json
import requests

def getExperimentIds(host):
    url = f"http://{host}/api/experiments/names"

    with requests.get(url) as response:
        if response.status_code != 200:
            print(f"Experiment ids Failed with {response.status_code}")
        else:
            print("Experiment ids found successfully")
            expIds = []
            for x in json.loads(response.content):
                count = 0
                for i in x.values():
                    count += 1
                    if count%2 != 0:
                        expIds.append(i)

            return expIds

def deleteExperiment(host, expIds):
        url = f"http://{host}/api/experiments/"+random.choice(expIds)
        if expIds:
            with requests.delete(url) as response:
                if response.status_code != 200:
                    print(f"deleteExperiment Failed with {response.status_code}")
                else:
                    print("Experiment is deleted successfully")