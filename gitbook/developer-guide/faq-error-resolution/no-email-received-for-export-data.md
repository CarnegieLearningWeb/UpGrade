# No email received for export data

## Problem

No email received for export data

## Solution

You need to verify the environment values of that backend deployed on AWS elastic beanstalk in the configuration tab. Mainly check for the `HOST_URL`, which should be the backend API URL (For example: [https://upgrade-demo.carnegielearning.com/api ](https://upgrade-demo.carnegielearning.com/api)). Also, check the value present in `EMAIL_BUCKET` and `AWS_REGION` and it should resemble your AWS account with corresponding S3 bucket in the corresponding region.
