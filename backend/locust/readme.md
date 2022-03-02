# Locust Tests

## setup

Create a python virtual environment (Optional but recommended):

    pyenv virtualenv locust-venv
    pyenv local locust-venv

Install locust:

    pip install locust


## running the web interface

    locust -f load_test_upgrade_mathia.py

Open <http://localhost:8089>


## running headless

    locust -u 10 -t 60s -r 2 --headless --only-summary -f load_test_upgrade_mathia.py
    
    -u specifies the number of users
    -r specifies the spawn rate of the users
    -t specifies the runtime for the test as ?h?m?s


## specifying only launch calls

    locust -f load_test_upgrade_mathia.py -T required launcher

    -T specifies the tag

'portal' for portal tasks

'launcher' for launcher tasks

'assign-prog' for assignment progress service tasks

'logger' for logging tasks

'required' must be included because it initializes the student


## deleting experiments generated during tests

    python cleanup_experiments.py

Enter the number of experiments to delete. Only experiments named "LocustLoadTest" will be deleted.


## creating experiments

You will be prompted to specify different facets of each experiment created. Current supported options are: 

group level vs individual level experiment