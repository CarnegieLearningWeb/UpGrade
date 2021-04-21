import random
import requests

def createExperiment(host, groupExp, allExperimentPartitionIDConditionPair):
    url = f"http://{host}/api/experiments"
    # context = ["assign-prog", "app", "addition"]
    context = ["addition"]
    states = ["enrolling"]
    postExperimentRules = ["assign", "continue"]

    if( groupExp == True):
        # parameters for group experiment testing:
        consistencyRules = ["group"]
        asssignmentUnits = ["group"]
        groups = ["classId"]
    
    else:
        # parameters for individual experiment testing:
        consistencyRules = ["individual"]
        asssignmentUnits = ["individual"]
        groups = ["class", "school", "district", "teacher"]
    
    # random ids upto:
    n = 100
    # assignment weight for 1st condition: (1-100):
    weight = 50

    conditionCode1 = "c" + str(random.randint(1,n))
    conditionCode2 = "c" + str(random.randint(1,n))
    expId1 = "id" + str(random.randint(1,n))
    expPoint1 = "p" + str(random.randint(1,n))
    expId2 = "id" + str(random.randint(1,n))
    expPoint2 = "p" + str(random.randint(1,n))

    PartitionIDConditionPair1 = {"experimentPoint": expPoint1, "partitionId" : expId1, "condition" : conditionCode1}
    PartitionIDConditionPair2 =  {"experimentPoint": expPoint2, "partitionId" : expId2, "condition" : conditionCode2}
    allExperimentPartitionIDConditionPair.append(PartitionIDConditionPair1)
    allExperimentPartitionIDConditionPair.append(PartitionIDConditionPair2)

    # JSON data for creating an experiment:
    data = {
        "name": "TestExp"+ str(random.randint(1,n)),
        "description": "Test experiment is created here",
        "consistencyRule": random.choice(consistencyRules),
        "assignmentUnit": random.choice(asssignmentUnits),
        "group": random.choice(groups),
        "postExperimentRule": random.choice(postExperimentRules),
        "state": random.choice(states),
        "tags": ["Workspace", "Content"],
        "context": [random.choice(context)],
        "conditions": [
            {
                "name": "condition1",
                "description": "condition description 1",
                "assignmentWeight": weight,
                "conditionCode": conditionCode1
            },
            {
                "name": "condition2",
                "description": "condition description 2",
                "assignmentWeight": 100-weight,
                # "conditionCode": random.choice(conditionCodes)
                "conditionCode": conditionCode2
            }
        ],
        "partitions": [
            {
                "name": expPoint1,
                "expId": expId1,
                "expPoint": expPoint1,
                "description": expId1
            },
            {
                "name": expPoint2,
                "expId": expId2,
                "expPoint": expPoint2,
                "description": expId2
            }
        ]
    }

    response = requests.post(url, json = data)
    if response.status_code != 200:
        print(f"createExperiment Failed with {response.status_code}")
    else:
        print("New Experiment is created")
    
    return allExperimentPartitionIDConditionPair