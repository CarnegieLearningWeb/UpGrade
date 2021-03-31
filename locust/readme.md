# Locust Tests

## setup

Create a python virtual environment (Optional but recommended):

    pyenv virtualenv locust-venv
    pyenv local locust-venv

Install locust:

    pip install locust

## running the web interface

    locust -f upgrade-mathia.py

Open <http://localhost:8089>

## running headless

    locust -u 1 -t 60s -r 10 --headless --only-summary -f upgrade-mathia.py

## specifying only launch calls

    locust -f upgrade-mathia.py -T required launcher
