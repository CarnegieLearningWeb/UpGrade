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

Enter the number of experiments to delete


## changing from individual level to group level experiment

On line 20 in load_test_upgrade_mathia.py, change False to True

    groupExp = False

False represents an individual level experiment and is the default value.

True represents a group level experiment.