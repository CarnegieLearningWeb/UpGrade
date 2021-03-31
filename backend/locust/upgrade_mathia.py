import random
import uuid
import sys
import json
import threading
import time
from  upgrade_mathia_data import modules, workspaces
from locust import HttpUser, task, tag, between

schools = {}
students = {}

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


class UpgradeUser(HttpUser):

    wait_time = between(0.1, 10)
    host = ""

    #Portal Tasks
    ## Portal calls init -> setGroupMembership in reality
    @tag("required")
    @task(3)
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

            workingSchoolId = random.choice(list(student["schools"].keys()))
            workingClassId = random.choice(list(student["schools"][workingSchoolId]["classes"].keys()))
            workingInstructorId = random.choice(list(student["schools"][workingSchoolId]["classes"][workingClassId]["instructorId"]))

            url = f"https://{self.host}/api/init"
            data = {
                "id": student["studentId"],
                "group": {
                    "schoolId": schoolIds,
                    "classId": classIds,
                    "instructorId": instructorIds
                },
                "workingGroup": {}
            }

            with self.client.post(url, json = data, catch_response = True) as response:
                if response.status_code != 200:
                    print(f"Init Failed with {response.status_code}")

    @tag("portal")
    @task(3)
    def getAllExperimentConditionsPortal(self):
        student = getStudent(False)

        if student:
            with student["lock"]:
                url = f"https://{self.host}/api/assign"
                data = {
                    "userId": student["studentId"],
                    "context": "portal"
                }

                with self.client.post(url, json = data, catch_response = True) as response:
                    if response.status_code != 200:
                        print(f"getAllExperimentConditions in portal Failed with {response.status_code}")
        else:
            print("Waiting on users to be initialized")

    #Launcher
    @tag("launcher")
    @task(3)
    def setWorkingGroup(self):
        student = getStudent(False)

        if student:
            with student["lock"]:
                workingSchoolId = random.choice(list(student["schools"].keys()))
                workingClassId = random.choice(list(student["schools"][workingSchoolId]["classes"].keys()))
                workingInstructorId = random.choice(list(student["schools"][workingSchoolId]["classes"][workingClassId]["instructorId"]))

                url = f"https://{self.host}/api/workinggroup"
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
                        print(f"SetWorkingGroup Failed with {response.status_code}")
        else:
            print("Waiting on users to be initialized")

    @tag("launcher")
    @task(3)
    def getAllExperimentConditionsAssignProg(self):
        student = getStudent(False)

        if student:
            with student["lock"]:
                url = f"https://{self.host}/api/assign"
                data = {
                    "userId": student["studentId"],
                    "context": "assign-prog"
                }

                with self.client.post(url, json = data, catch_response = True) as response:
                    if response.status_code != 200:
                        print(f"getAllExperimentConditions in assign-prog Failed with {response.status_code}")

        else:
            print("Waiting on users to be initialized")

    @tag("launcher")
    @task(3)
    def setAltIds(self):
        student = getStudent(False)
        if student:
            with student["lock"]:
                workingSchoolId = random.choice(list(student["schools"].keys()))
                workingClassId = random.choice(list(student["schools"][workingSchoolId]["classes"].keys()))
                classModules = student["schools"][workingSchoolId]["classes"][workingClassId]["classModules"]

                url = f"https://{self.host}/api/useraliases"
                data = {
                    "userId": student["studentId"],
                    "aliases": [student["studentId"] + m for m in classModules]
                }

                with self.client.post(url, json = data, catch_response = True) as response:
                    if response.status_code != 200:
                        print(f"SetAltIds Failed with {response.status_code}")
        else:
            print("Waiting on users to be initialized")

    #Assignment Progress Service
    #Skipping getExperimentCondition() - Assume getAllExperimentConditionsAssignProg() has been called, so getExperimentCondition() does not hit API

    @tag("assign-prog")
    @task(5)
    def markExperimentPoint(self):
        student = getStudent(False)
        if student:
            with student["lock"]:
                workingSchoolId = random.choice(list(student["schools"].keys()))
                workingClassId = random.choice(list(student["schools"][workingSchoolId]["classes"].keys()))
                workingModule = random.choice(student["schools"][workingSchoolId]["classes"][workingClassId]["classModules"])
                workingWorkspace = random.choice(modules[workingModule])
                workingCondition = random.choice(workspaces[workingWorkspace])

                url = f"https://{self.host}/api/mark"
                data = {
                    "userId": student["studentId"],
                    "experimentPoint": "SelectSection",
                    "partitionId": workingWorkspace,
                    "condition": workingCondition
                }

                with self.client.post(url, json = data, catch_response = True) as response:
                    
                    if response.status_code != 200:
                        print(f"MarkExperimentPoint Failed with {response.status_code}")
        else:
            print("Waiting on users to be initialized")

    #UpgradeForwarder
    @tag("logger")
    @task(4)
    def logEvent(self):
        student = getStudent(False)
        if student:
            with student["lock"]:
                url = f"https://{self.host}/api/log"
                data = {
                    "userId": student["studentId"],
                    "value": [] #TODO: Populate with more realistic values
                }

                with self.client.post(url, json = data, catch_response = True) as response:
                    if response.status_code != 200:
                        print(f"LogEvent Failed with {response.status_code}")
        else:
            print("Waiting on users to be initialized")

        