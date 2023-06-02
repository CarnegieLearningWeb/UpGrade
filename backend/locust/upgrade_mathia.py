import random
import uuid
import sys
import json
import threading
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
expIds = deleteExperiment.getExperimentIds(protocol, host)

if option == 1:
    deleteExperiment.deleteExperiment(protocol, host, expIds)
elif option == 2:
    for i in range(len(expIds)):
        expIds = deleteExperiment.getExperimentIds(protocol, host)
        deleteExperiment.deleteExperiment(protocol, host, expIds)
else:
    pass

# create new experiments:
# set groupExp to True for creating a group level experiment or False for a individual level experiment:
groupExp = False
experimentCount = int(input("Enter the number of experiments to be created: "))

for i in range(experimentCount):
    experimentType = int(input("Enter the experiment type: Enter 1 for Simple and 2 for Factorial:"))
    # returning the updated partionconditionpair list:
    experimentType = "Simple" if experimentType == 1 else "Factorial"
    allExperimentPartitionIDConditionPair = createExperiment.createExperiment(protocol, host, allExperimentPartitionIDConditionPair, experimentType)

### Start enrolling students in the newly created experiment: ###
#Return a new or existing Student
def getStudent(initialize):
    if len(students.keys()) < 10:
        if not initialize:
            return None
        else:
            createNew = True
    else:
        createNew = random.choices([True, False], [65, 35])[0]
       
    #Place a student in 1 or 2 schools, with 1 or 2 classes
    if createNew and initialize:
       studentId = str(uuid.uuid4())

       schoolCount = random.choices([1, 2], [99, 1])[0]
       if schoolCount == 1:
           numClasses = [random.choices([1, 2], [63, 37])[0]]
       else:
           numClasses = [random.choices([1, 2], [63, 37])[0], random.choices([1, 2], [63, 37])[0]]

       schoolIds = getSchools(schoolCount)
       classData = getClasses(schoolIds, numClasses)

       students[studentId] = {
           "studentId": studentId,
           "lock": threading.Lock(),
           "schools": {}
       }

       with students[studentId]["lock"]:
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
    else:
       studentId = random.choice(list(students.keys()))

    return students[studentId]

#Return a list of schools, either new or existing
def getSchools(schoolCount):
    retSchools = []
    for i in range(schoolCount):
        if len(schools.keys()) < 10:
            createNew = True
        elif len(schools.keys()) >= 2140:
            createNew = False
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
            if len(schools[schoolId]["classes"].keys()) < 5:
                createNew = True
            elif len(schools[schoolId]["classes"].keys()) >= 50:
                createNew = False
            else:
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

    wait_time = between(0.1, 10)
    #Portal Tasks
    ## Portal calls init -> setGroupMembership in reality

    # Task 1:
    @tag("required")
    @task
    def initSetGroupMembership(self):
        student = getStudent(True)
        with student["lock"]:
            schoolIds = list(student["schools"].keys())

            classIds = []
            for schoolId in student["schools"].keys():
                classIds.extend(list(student["schools"][schoolId]["classes"].keys()))

            instructorIds = []
            for schoolId in student["schools"].keys():
                for classId in student["schools"][schoolId]["classes"].keys():
                    instructorIds.append(student["schools"][schoolId]["classes"][classId]["instructorId"])

            url = protocol + f"://{host}/api/init"
            print("/init for userid: " + student["studentId"])
            data = {
                "id": student["studentId"],
                "group": {
                    "schoolId": schoolIds,
                    "classId": classIds,
                    "instructorId": instructorIds
                }
                ,
                "workingGroup": {}
            }

            with self.client.post(url, json = data, catch_response = True) as response:
                if response.status_code != 200:
                    print(f"Init Failed with {response.status_code} for userid: " + student["studentId"])

    # Task 2:
    #Launcher
    @tag("launcher")
    @task
    def setWorkingGroup(self):
        student = getStudent(False)

        if student:
            with student["lock"]:
                workingSchoolId = random.choice(list(student["schools"].keys()))
                workingClassId = random.choice(list(student["schools"][workingSchoolId]["classes"].keys()))
                workingInstructorId = student["schools"][workingSchoolId]["classes"][workingClassId]["instructorId"]
                url = protocol + f"://{host}/api/workinggroup"
                print("/workinggroup for userid: " + student["studentId"])
                data = {
                    "id": student["studentId"],
                    "workingGroup": {
                        "schoolId": workingSchoolId,
                        "classId": workingClassId,
                        "instructorId": workingInstructorId
                    }
                }

                with self.client.post(url, json = data, catch_response = True) as response:
                    if response.status_code != 200:
                        print(f"setWorkingGroup Failed with {response.status_code} for userid: " + student["studentId"])
        else:
            print("2. Waiting on users to be initialized")

    # Task 3a:
    @tag("portal")
    @task
    def getAllExperimentConditionsPortal(self):
        student = getStudent(False)

        if student:
            with student["lock"]:
                url = protocol + f"://{host}/api/assign"
                print("/assign for userid: " + student["studentId"])
                data = {
                    "userId": student["studentId"],
                    "context": "addition"
                }

                with self.client.post(url, json = data, catch_response = True) as response:
                    if response.status_code != 200:
                        print(f"/assign Failed with {response.status_code} for userid: " + student["studentId"])
        else:
            print("3. Waiting on users to be initialized")

    # Task 3b:
    @tag("launcher")
    @task
    def getAllExperimentConditionsAssignProg(self):
        student = getStudent(False)

        if student:
            with student["lock"]:
                url = protocol + f"://{host}/api/assign"
                data = {
                    "userId": student["studentId"],
                    "context": "assign-prog"
                }

                with self.client.post(url, json = data, catch_response = True) as response:
                    if response.status_code != 200:
                        print(f"getAllExperimentConditions in assign-prog Failed with {response.status_code}")

        else:
            print("3. Waiting on users to be initialized")

    # Task 4:
    @tag("launcher")
    @task
    def setAltIds(self):
        student = getStudent(False)
        if student:
            with student["lock"]:
                workingSchoolId = random.choice(list(student["schools"].keys()))
                workingClassId = random.choice(list(student["schools"][workingSchoolId]["classes"].keys()))
                classModules = student["schools"][workingSchoolId]["classes"][workingClassId]["classModules"]

                url = protocol + f"://{host}/api/useraliases"
                print("/useraliases for userid: " + student["studentId"])
                data = {
                    "userId": student["studentId"],
                    "aliases": [student["studentId"] + m for m in classModules]
                }

                with self.client.post(url, json = data, catch_response = True) as response:
                    if response.status_code != 200:
                        print(f"/useraliases Failed with {response.status_code} for userid: " + student["studentId"])
        else:
            print("4. Waiting on users to be initialized")

    #Assignment Progress Service
    #Skipping getExperimentCondition() - Assume getAllExperimentConditionsAssignProg() has been called, so getExperimentCondition() does not hit API

    # Task 5: (Student count gets incremented here on marking complete)
    @tag("assign-prog")
    @task
    def markExperimentPoint(self):
        student = getStudent(False)
        if student:
            with student["lock"]:
                url = protocol + f"://{host}/api/mark"
                print("/mark for userid: " + student["studentId"])
                if(len(allExperimentPartitionIDConditionPair) == 0):
                    print("No assigned conditions found")
                    return
                else:
                    print("allExperimentPartitionIDConditionPair: ", allExperimentPartitionIDConditionPair)
                # pick a random pair of PartitionIdConditionId from allExperimentPartitionIDConditionPair
                markPartitionIDConditionPair = random.choice(allExperimentPartitionIDConditionPair)

                data = {
                    "userId": student["studentId"],
                    "experimentPoint": markPartitionIDConditionPair['site'],
                    "partitionId": markPartitionIDConditionPair['target'],
                    "condition": markPartitionIDConditionPair['condition']
                }

                with self.client.post(url, json = data, catch_response = True) as response:
                    
                    if response.status_code != 200:
                        print(f"/mark Failed with {response.status_code} for userid: " + student["studentId"])
        else:
            print("5. Waiting on users to be initialized")

    # Task 6:
    #UpgradeForwarder
    @tag("logger")
    @task
    def logEvent(self):
        student = getStudent(False)
        if student:
            with student["lock"]:
                url = protocol + f"://{host}/api/log"
                data = {
                    "userId": student["studentId"],
                    "value": [] #TODO: Populate with more realistic values
                }

                with self.client.post(url, json = data, catch_response = True) as response:
                    if response.status_code != 200:
                        print(f"LogEvent Failed with {response.status_code}")
        else:
            print("6. Waiting on users to be initialized")

class UpgradeUser(HttpUser):
    wait_time = between(0.1, 10)
    host = "localhost:3030"
    tasks = [UpgradeUserTask]