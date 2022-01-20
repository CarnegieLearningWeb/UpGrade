from  upgrade_mathia_data import modules, workspaces
import deleteExperiment

protocol = "http"
host = "localhost:3030"

option = int(input("Enter the number of  experiments to delete: "))
expIds = deleteExperiment.getExperimentIds(protocol, host)

if option > len(expIds):
    option = len(expIds)

for i in range(option):
        expIds = deleteExperiment.getExperimentIds(protocol, host)
        deleteExperiment.deleteExperiment(protocol, host, expIds)
