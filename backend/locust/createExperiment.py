import random
import requests

def createExperiment(protocol, host, allExperimentPartitionIDConditionPair):
    url = protocol + f"://{host}/api/experiments"
    # context = ["assign-prog", "app", "addition"]
    context = ["addition"]
    states = ["enrolling"]
    postExperimentRules = ["assign", "continue"]

    if( getGroupExp() == True):
        # parameters for group experiment testing:
        consistencyRules = ["group"]
        asssignmentUnits = ["group"]
        groups = ["classId"]
    
    else:
        # parameters for individual experiment testing:
        consistencyRules = ["individual"]
        asssignmentUnits = ["individual"]
        groups = [""]
    
    # random ids upto:
    n = 1000
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
        "name": "LocustLoadTestExp"+ str(random.randint(1,n)),
        "description": "Test experiment is created here",
        "consistencyRule": consistencyRules[0],
        "assignmentUnit": asssignmentUnits[0],
        "group": groups[0],
        "postExperimentRule": random.choice(postExperimentRules),
        "state": random.choice(states),
        "tags": ["Workspace", "Content"],
        # "enrollmentCompleteCondition": {
        #     "userCount": 100,
        #     "groupCount": 20
	    # },
        "context": [random.choice(context)],
        "logging": False,
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
                "conditionCode": conditionCode2
            }
        ],
        "partitions": [
            {
                "name": expPoint1,
                "expId": expId1,
                "expPoint": expPoint1,
                "description": expId1,
                "order": 1
            },
            {
                "name": expPoint2,
                "expId": expId2,
                "expPoint": expPoint2,
                "description": expId2,
                "order": 2
            }
        ]
    }

    response = requests.post(url, json = data)
    if response.status_code != 200:
        print(f"createExperiment Failed with {response.status_code}")
    else:
        print("New Experiment is created", str(data))
    
    return allExperimentPartitionIDConditionPair


def getGroupExp():
    option = input("Is this a group level experiment? Y/N ")
    return option == "Y" or option == 'y'