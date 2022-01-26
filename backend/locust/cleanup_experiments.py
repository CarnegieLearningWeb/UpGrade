from  upgrade_mathia_data import modules, workspaces
import deleteExperiment

protocol = "http"
host = "localhost:3030"

option = int(input("Enter the number of experiments to delete: "))
expIds = deleteExperiment.getExperimentIds(protocol, host)

if option > len(expIds):
    option = len(expIds)

print(f"There are {len(expIds)} locust test experiments")
doublecheck = input(f"Are you sure you want to delete {option} of them? Y/N: ")

if doublecheck == "Y" or doublecheck == "y":
    for i in range(option):
            deleteExperiment.deleteExperiment(protocol, host, expIds)