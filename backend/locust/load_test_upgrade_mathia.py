from datetime import datetime
import random
import uuid
from  upgrade_mathia_data import modules, workspaces
from locust import HttpUser, SequentialTaskSet, task, tag, between
import createExperiment
import deleteExperiment

schools = {}
students = {}

allExperimentPartitionIDConditionPair = []

# Setting host URL's:
protocol = "http"
host = "localhost:3030"

# clear existing experiments:
option = int(input("Enter 1 for delete a single random experiment and 2 to delete all experiments, else Enter 0 for not deleting any experiment: "))

if option == 1:
    expIds = deleteExperiment.getExperimentIds(protocol, host)
    deleteExperiment.deleteExperiment(protocol, host, expIds)
elif option == 2:
    expIds = deleteExperiment.getExperimentIds(protocol, host)
    for i in range(len(expIds)):
        expIds = deleteExperiment.getExperimentIds(protocol, host)
        deleteExperiment.deleteExperiment(protocol, host, expIds)
else:
    pass

# create new experiments:
experimentCount = int(input("Enter the number of experiments to be created: "))
for i in range(experimentCount):
    experimentType = int(input("Enter the experiment type: Enter 1 for Simple and 2 for Factorial:"))
    # returning the updated partionconditionpair list:
    experimentType = "Simple" if experimentType == 1 else "Factorial"
    allExperimentPartitionIDConditionPair = createExperiment.createExperiment(protocol, host, allExperimentPartitionIDConditionPair, experimentType)

### Start enrolling students in the newly created experiment: ###
#Return a new Student
def initStudent():
    studentId = str(uuid.uuid4())
    
    # 99% of the time, students are in one class, but 1% of the time they will be in two classes
    schoolCount = random.choices([1, 2], [99, 1])[0]
    if schoolCount == 1:
        numClasses = [random.choices([1, 2], [63, 37])[0]]
    else:
        numClasses = [random.choices([1, 2], [63, 37])[0], random.choices([1, 2], [63, 37])[0]]

    schoolIds = getSchools(schoolCount)
    classData = getClasses(schoolIds, numClasses)

    students[studentId] = {
        "studentId": studentId,
        "schools": {}
   }

    for schoolId in schoolIds:
        students[studentId]["schools"][schoolId] = {
            "classes": {},
            "instructors": []
        }

    for classObject in classData:
        students[studentId]["schools"][classObject["schoolId"]]["classes"][classObject["classId"]] = {
            "classId": classObject["classId"],
            "instructorId": classObject["instructorId"],
            "classModules": classObject["classModules"]
        }

    return students[studentId]

#Return a list of schools, either new or existing
def getSchools(schoolCount):
    retSchools = []
    for i in range(schoolCount):
        # minimum of 10 school, if less always create new school
        if len(schools.keys()) < 10:
            createNew = True
        # maximum of 2140 schools, if reached don't create new school
        elif len(schools.keys()) >= 2140:
            createNew = False
        # if schoolCount is between 10 and 2140, create a new school 50% of the time
        else:
            createNew = random.choices([True, False], [50, 50])[0]

        if createNew:
            schoolId = str(uuid.uuid4())
            while schoolId in retSchools:
                schoolId = str(uuid.uuid4())

            instructors = []
            for i in range(10):
                instructors.append(str(uuid.uuid4()))

            schools[schoolId] = {
                "classes": {},
                "instructors": instructors
            }

        else:
            schoolId = random.choice(list(schools.keys()))
            while schoolId in retSchools:
                schoolId = random.choice(list(schools.keys()))

        retSchools.append(schoolId)

    return retSchools

#Return a list of classes, either new or existing
def getClasses(schoolIds, numClasses):
    retClasses = []
    retClassData = []
    for i in range(len(schoolIds)):
        for j in range(numClasses[i]):
            schoolId = schoolIds[i]
            #Each school has at least 5 classes so create a new class if under 5
            if len(schools[schoolId]["classes"].keys()) < 5:
                createNew = True
            #Each school has a maximum of 50 classes so do not create a new class
            elif len(schools[schoolId]["classes"].keys()) >= 50:
                createNew = False
            else:
                #if numClasses is between 5 and 50, create a new class 50% of the time
                createNew = random.choices([True, False], [50, 50])[0] 

            if createNew:
                classId = str(uuid.uuid4())
                while classId in retClasses:
                    classId = str(uuid.uuid4())

                instructorId = random.choice(schools[schoolId]["instructors"])
                classModules = random.sample(list(modules.keys()), k=5)
                schools[schoolId]["classes"][classId] = {
                    "schoolId": schoolId,
                    "classId": classId,
                    "instructorId": instructorId,
                    "classModules": classModules
                }

            else:
                classId = random.choice(list(schools[schoolId]["classes"].keys()))
                while classId in retClasses:
                    classId = random.choice(list(schools[schoolId]["classes"].keys()))

            retClasses.append(classId)
            retClassData.append(schools[schoolId]["classes"][classId])

    return retClassData

# Main Locust API calls for enrolling students in an experiment:
class UpgradeUserTask(SequentialTaskSet):

    # each User represents one Student
    def on_start(self):
        self.student = initStudent()

    #Portal Tasks
    ## Portal calls init -> setGroupMembership in reality

    # Task 1: portal calls /init
    @tag("required", "portal")
    @task
    def init(self):
        url = protocol + f"://{host}/api/init"
        print("/init for userid: " + self.student["studentId"])
        data = {
            "id": self.student["studentId"],
            "group": {},
            "workingGroup": {}
        }

        with self.client.post(url, json = data, catch_response = True) as response:
            if response.status_code != 200:
                print(f"Init Failed with {response.status_code} for userid: " + self.student["studentId"])

    # Task 2: portal calls /groupmembership
    @tag("portal")
    @task
    def setGroupMembership(self):
        schoolIds = list(self.student["schools"].keys())

        classIds = []
        for schoolId in self.student["schools"].keys():
            classIds.extend(list(self.student["schools"][schoolId]["classes"].keys()))

        instructorIds = []
        for schoolId in self.student["schools"].keys():
            for classId in self.student["schools"][schoolId]["classes"].keys():
                instructorIds.append(self.student["schools"][schoolId]["classes"][classId]["instructorId"])

        url = protocol + f"://{host}/api/groupmembership"
        print("/groupmembership for userid: " + self.student["studentId"])
        data = {
            "id": self.student["studentId"],
            "group": {
                "schoolId": schoolIds,
                "classId": classIds,
                "instructorId": instructorIds
            }
        }

        with self.client.post(url, json = data, catch_response = True) as response:
            if response.status_code != 200:
                print(f"Group membership Failed with {response.status_code} for userid: " + self.student["studentId"])


    # Task 3: portal calls /assign
    @tag("portal")
    @task
    def getAllExperimentConditionsPortal(self):
        url = protocol + f"://{host}/api/assign"
        print("/assign portal for userid: " + self.student["studentId"])
        data = {
            "userId": self.student["studentId"],
            "context": "portal"
        }

        with self.client.post(url, json = data, catch_response = True) as response:
            if response.status_code != 200:
                print(f"/assign Failed with {response.status_code} for userid: " + self.student["studentId"])


    # Launcher tasks
    # Task 4: launcher calls /workinggroup
    @tag("launcher")
    @task
    def setWorkingGroup(self):
        workingSchoolId = random.choice(list(self.student["schools"].keys()))
        workingClassId = random.choice(list(self.student["schools"][workingSchoolId]["classes"].keys()))
        workingInstructorId = self.student["schools"][workingSchoolId]["classes"][workingClassId]["instructorId"]
        url = protocol + f"://{host}/api/workinggroup"
        print("/workinggroup for userid: " + self.student["studentId"])
        data = {
            "id": self.student["studentId"],
            "workingGroup": {
                "schoolId": workingSchoolId,
                "classId": workingClassId,
                "instructorId": workingInstructorId
            }
        }

        with self.client.post(url, json = data, catch_response = True) as response:
            if response.status_code != 200:
                print(f"setWorkingGroup Failed with {response.status_code} for userid: " + self.student["studentId"])

    # Task 5: launcher calls /useraliases
    @tag("launcher")
    @task
    def setAltIds(self):
        workingSchoolId = random.choice(list(self.student["schools"].keys()))
        workingClassId = random.choice(list(self.student["schools"][workingSchoolId]["classes"].keys()))
        classModules = self.student["schools"][workingSchoolId]["classes"][workingClassId]["classModules"]

        url = protocol + f"://{host}/api/useraliases"
        print("/useraliases for userid: " + self.student["studentId"])
        data = {
            "userId": self.student["studentId"],
            "aliases": [self.student["studentId"] + m for m in classModules]
        }

        with self.client.post(url, json = data, catch_response = True) as response:
            if response.status_code != 200:
                print(f"/useraliases Failed with {response.status_code} for userid: " + self.student["studentId"])


    #Assignment Progress Service
    #Skipping getExperimentCondition() - Assume getAllExperimentConditionsAssignProg() has been called, so getExperimentCondition() does not hit API

    # Task 6: workspace calls /assign or uses cached data
    @tag("assign-prog")
    @task
    def getAllExperimentConditionsAssignProg(self):
        url = protocol + f"://{host}/api/assign"
        print("/assign assign-prog for userid: " + self.student["studentId"])

        data = {
            "userId": self.student["studentId"],
            "context": "assign-prog"
        }

        with self.client.post(url, json = data, catch_response = True) as response:
            if response.status_code != 200:
                print(f"getAllExperimentConditions in assign-prog Failed with {response.status_code}")

    # mark is called after finishing a workspace. In reality, mark is called 15-30 mins after assign
    # Task 7: Student count gets incremented here on marking complete
    @tag("assign-prog")
    @task
    def markExperimentPoint(self):
        url = protocol + f"://{host}/api/mark"
        print("/mark for userid: " + self.student["studentId"])
        if(len(allExperimentPartitionIDConditionPair) == 0):
            print("No assigned conditions found")
            return
        else:
            print("allExperimentPartitionIDConditionPair: ", allExperimentPartitionIDConditionPair)
        # pick a random pair of PartitionIdConditionId from allExperimentPartitionIDConditionPair
        markPartitionIDConditionPair = random.choice(allExperimentPartitionIDConditionPair)
        data = {
            "userId": self.student["studentId"],
            "experimentPoint": markPartitionIDConditionPair['site'],
            "partitionId": markPartitionIDConditionPair['target'],
            "condition": markPartitionIDConditionPair['condition']
        }

        # pick a random assigned workspace - requires /assign response to be saved
        # markPartitionIDConditionPair = random.choice(self.assignedWorkspaces)

        # data = {
        #     "userId": self.student["studentId"],
        #     "experimentPoint": markPartitionIDConditionPair['expPoint'],
        #     "partitionId": markPartitionIDConditionPair['expId'],
        #     "condition": markPartitionIDConditionPair['assignedCondition']['conditionCode']
        # }

        with self.client.post(url, json = data, catch_response = True) as response:
            if response.status_code != 200:
                print(f"/mark Failed with {response.status_code} for userid: " + self.student["studentId"])

    # Task 8: failed experiment point
    @tag("assign-prog")
    @task
    def failedExperimentPoint(self):
        url = protocol + f"://{host}/api/failed"
        print("/failed for userid: " + self.student["studentId"])
        if(len(allExperimentPartitionIDConditionPair) == 0):
            print("No assigned conditions found")
            return
        else:
            print("allExperimentPartitionIDConditionPair: ", allExperimentPartitionIDConditionPair)
        # pick a random pair of PartitionIdConditionId from allExperimentPartitionIDConditionPair
        markPartitionIDConditionPair = random.choice(allExperimentPartitionIDConditionPair)

        data = {
            "userId": self.student["studentId"],
            "experimentPoint": markPartitionIDConditionPair['site'],
            "partitionId": markPartitionIDConditionPair['target'],
            "condition": markPartitionIDConditionPair['condition']
        }

        # pick a random assigned workspace - requires /assign response to be saved
        # markPartitionIDConditionPair = random.choice(self.assignedWorkspaces)

        # data = {
        #     "reason": "locust tests",
        #     "experimentPoint": markPartitionIDConditionPair['expPoint'],
        #     "userId": self.student["studentId"],
        #     "experimentId": markPartitionIDConditionPair['expId']
        # }

        with self.client.post(url, json = data, catch_response = True) as response:
            if response.status_code != 200:
                print(f"/failed Failed with {response.status_code} for userid: " + self.student["studentId"])

    # Generate mock log data 
    def genMockLog(self):
        attributes = {
            "totalTimeSeconds": random.randint(1,500000),
            "totalMasteryWorkspacesCompleted": random.randint(1,50),
            "totalConceptBuildersCompleted": random.randint(1,50),
            "totalMasteryWorkspacesGraduated": random.randint(1,50),
            "totalSessions": random.randint(1,100),
            "totalProblemsCompleted": random.randint(1,1000)
        }
        groupedMetrics = {
            "groupClass": "workspace",
            "groupKey": random.choice(list(workspaces.keys())),
            "groupUniquifier": str(datetime.now()),
            "attributes": {
                "timeSeconds": random.randint(1,500),
                "hintCount": random.randint(1,10),
                "errorCount": random.randint(1,20),
                "completionCount": 1,
                "workspaceCompletionStatus": "GRADUATED",
                "problemsCompleted": random.randint(1,10)
            }
        }
        return {
            "userId": self.student["studentId"],
            "timestamp": str(datetime.now()),
            "metrics": {
                "attributes": attributes,
                "groupedMetrics": [groupedMetrics]
            }
        }

    #UpgradeForwarder
    # Task 9:
    @tag("logger")
    @task
    def logEvent(self):
        url = protocol + f"://{host}/api/log"
        data = {
            "userId": self.student["studentId"],
            "value": [
                    self.genMockLog()
                ]
        }

        with self.client.post(url, json = data, catch_response = True) as response:
            if response.status_code != 200:
                print(f"LogEvent Failed with {response.status_code}")


class UpgradeUser(HttpUser):
    wait_time = between(0.1, 10)
    host = "localhost:3030"
    tasks = [UpgradeUserTask]