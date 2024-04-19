import random
import requests
import uuid

def createExperiment(protocol, host, allExperimentPartitionIDConditionPair, experimentType):
    url = protocol + f"://{host}/api/experiments"
    context = ["assign-prog"]
    # context = ["addition"]
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
    target1 = "id" + str(random.randint(1,n))
    site1 = "p" + str(random.randint(1,n))
    target2 = "id" + str(random.randint(1,n))
    site2 = "p" + str(random.randint(1,n))
    factor1 = "F" + str(random.randint(1,n))
    factor2 = "F" + str(random.randint(1,n))
    level1 = "L" + str(random.randint(1,n))
    level2 = "L" + str(random.randint(1,n))
    level3 = "L" + str(random.randint(1,n))
    factorialConditionCode1 = factor1 + "=" + level1 + "; " + factor2 + "=" + level3
    factorialConditionCode2 = factor1 + "=" + level2 + "; " + factor2 + "=" + level3
    levelId1 = str(uuid.uuid4())
    levelId2 = str(uuid.uuid4())
    levelId3 = str(uuid.uuid4())
    conditionId1 = str(uuid.uuid4())
    conditionId2 = str(uuid.uuid4())
    partitionId1 = str(uuid.uuid4())
    partitionId2 = str(uuid.uuid4())
    levelElementId1 = str(uuid.uuid4())
    levelElementId2 = str(uuid.uuid4())
    levelElementId3 = str(uuid.uuid4())
    levelElementId4 = str(uuid.uuid4())

    if experimentType == 'Simple':
        PartitionIDConditionPair1 = {"site": site1, "target" : target1, "condition" : conditionCode1}
        PartitionIDConditionPair2 =  {"site": site2, "target" : target2, "condition" : conditionCode2}
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
            "context": [random.choice(context)],
            "filterMode": "includeAll",
            "type": "Simple",
            "logging": False,
            "conditions": [
                {
                    "id": conditionId1,
                    "name": "condition1",
                    "description": "condition description 1",
                    "assignmentWeight": weight,
                    "conditionCode": conditionCode1,
                    "order": 1
                },
                {
                    "id": conditionId2,
                    "name": "condition2",
                    "description": "condition description 2",
                    "assignmentWeight": 100-weight,
                    "conditionCode": conditionCode2,
                    "order": 2
                }
            ],
            "partitions": [
                {
                    "id": partitionId1,
                    "site": site1,
                    "target": target1,
                    "description": target1,
                    "order": 1,
                    "excludeIfReached": False
                },
                {
                    "id": partitionId2,
                    "site": site2,
                    "target": target2,
                    "description": target2,
                    "order": 2,
                    "excludeIfReached": False
                }
            ],
            "experimentSegmentInclusion": {
                "segment": {
                    "type": "private",
                    "groupForSegment": [
                    {
                        "groupId": "All",
                        "type": "All"
                    }
                    ]
                }
                },
                "experimentSegmentExclusion": {
                "segment": {
                    "type": "private"
                }
            }
        }
    else:
        PartitionIDConditionPair1 = {"site": site1, "target" : target1, "condition" : factorialConditionCode1}
        PartitionIDConditionPair2 =  {"site": site2, "target" : target2, "condition" : factorialConditionCode2}
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
            "context": [random.choice(context)],
            "filterMode": "includeAll",
            "logging": False,
            "type": "Factorial",
            "conditions": [
                {
                    "name": "condition1",
                    "id": conditionId1,
                    "description": "condition description 1",
                    "assignmentWeight": weight,
                    "conditionCode": factorialConditionCode1,
                    "order": 1,
                    "levelCombinationElements": [
                        {
                            "id": levelElementId1,
                            "level": {
                                "id": levelId1,
                                "name": level1,
                                "description": level1,
                                "payload": {
                                    "value": level1,
                                    "type": "string"
                                }
                            }
                        },
                        {
                            "id": levelElementId2,
                            "level": {
                                "id": levelId3,
                                "name": level3,
                                "description": level3,
                                "payload": {
                                    "value": level3,
                                    "type": "string"
                                }
                            }
                        }
                    ]
                },
                {
                    "name": "condition2",
                    "id": conditionId2,
                    "description": "condition description 2",
                    "assignmentWeight": weight,
                    "conditionCode": factorialConditionCode2,
                    "order": 2,
                    "levelCombinationElements": [
                        {
                            "id": levelElementId3,
                            "level": {
                                "id": levelId2,
                                "name": level2,
                                "description": level2,
                                "payload": {
                                    "value": level2,
                                    "type": "string"
                                }
                            }
                        },
                        {
                            "id": levelElementId4,
                            "level": {
                                "id": levelId3,
                                "name": level3,
                                "description": level3,
                                "payload": {
                                    "value": level3,
                                    "type": "string"
                                }
                            }
                        }
                    ]
                },
            ],
            "partitions": [
                {
                    "id": partitionId1,
                    "site": site1,
                    "target": target1,
                    "description": target1,
                    "order": 1,
                    "excludeIfReached": False
                },
                {
                    "id": partitionId2,
                    "site": site2,
                    "target": target2,
                    "description": target2,
                    "order": 2,
                    "excludeIfReached": False
                }
            ],
            "factors": [
                {
                    "name": factor1,
                    "description": factor1,
                    "order": 1,
                    "levels": [
                        {
                            "id": levelId1,
                            "name": level1,
                            "description": level1,
                            "payload": {
                                "type": "string",
                                "value": level1
                            }
                        },
                        {
                            "id": levelId2,
                            "name": level2,
                            "description": level2,
                            "payload": {
                                "type": "string",
                                "value": level2
                            }
                        }
                    ]
                },
                {
                    "name": factor2,
                    "description": factor2,
                    "order": 2,
                    "levels": [
                        {
                            "id": levelId3,
                            "name": level3,
                            "description": level3,
                            "payload": {
                                "type": "string",
                                "value": level3
                            }
                        }
                    ]
                }
            ],
            "conditionPayloads": [],
            "experimentSegmentInclusion": {
                "segment": {
                    "type": "private",
                    "groupForSegment": [
                    {
                        "groupId": "All",
                        "type": "All"
                    }
                    ]
                }
                },
                "experimentSegmentExclusion": {
                    "segment": {
                        "type": "private"
                    }
            }
        }

    allExperimentPartitionIDConditionPair.append(PartitionIDConditionPair1)
    allExperimentPartitionIDConditionPair.append(PartitionIDConditionPair2)
    response = requests.post(url, json = data)
    if response.status_code != 200:
        print(f"createExperiment Failed with {response.status_code}")
    else:
        print("New Experiment is created")
    
    return allExperimentPartitionIDConditionPair


def getGroupExp():
    option = input("Is this a group level experiment? Y/N ")
    return option == "Y" or option == 'y'