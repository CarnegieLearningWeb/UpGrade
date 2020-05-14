### terraform script for creating infrastructure for upgrade and setting up CICD pipeline using AWS codepipeline


# Before you use...
- Download and install [Terraform](https://www.terraform.io/downloads.html) on your system.
- Install & Configure [aws-cli](https://docs.aws.amazon.com/cli/latest/userguide/install-windows.html) on your system.
- Setup a aws provider profile using `aws configure`
- Create a s3 Bucket to store `tfstate` files remotely. We recommend enable versioning on that bucket.
>   aws s3api create-bucket --acl private --bucket YOUR_BACKEND_TF-STATE_BUCKET

>   aws s3api put-bucket-versioning --bucket YOUR_BACKEND_TF-STATE_BUCKET --versioning-configuration Status=Enabled

`Note: Make sure to replace this bucket name with existing bucket inside environments/**/backend.tf & core/backend.tf`



Clone this repo using `https://github.com/CarnegieLearningWeb/educational-experiment-service.git` and then do `cd terraform`


### `terraform` top-level directory layout explanation 
    .
    ├── aws-ebs-with-rds                   # terraform module to create ebs environment with POSTGRES installed
    ├── aws-lambda                         # terraform module to create Schedular lambda function
    ├── aws-step-fn                        # terraform module to create Schedular step function 
    ├── core                       
          ├── core.tf                      # Config file to create core resources.
          ├── backend.tf                   # File that gives details of where to store tfstate files
          ├── variables.tf                 # Gives info about varibles required
          ├── tfvars.sample                # sample variables file
    ├── environments                        
        ├── dev                   
          ├── main.tf                       # Config file for dev environment.
          ├── backend.tf                   # File that gives details of where to store tfstate files
          ├── variables.tf                 # Gives info about varibles required
          ├── tfvars.sample                 # sample variables file
            
        ├── staging                   
          ├── main.tf                   # Config file for staging environment.
          ├── backend.tf                   # File that gives details of where to store tfstate files
          ├── variables.tf                 # Gives info about varibles required 
          ├── tfvars.sample                 # sample variables file
          
 
 Generate ssh key using `ssh-keygen -f mykey` (if you generate it with a different name, make sure to replace variables accordingly )
 
 
### You need to run this project in 2 phase.
 
- Create core resources that will be shared by all the environments. This includes AWS Code Commit repository and EBS application name.(We will create multiple EBS env under same EBS application)
- Create env specific resources.
    
 
### CORE RESOURCES
- under the `core` directory change the bucket name with the one you created for storing tfstate. 
- add var.tfvars file using sample var file. 
- use `terraform init`to initialize the project.
- use `terraform apply`to create the core resources.

### Env specific resources
 
- under the `environment/**` directory change the bucket name with the one you created for storing tfstate. 
- add var.tfvars file using sample var file. 
- use `terraform init`to initialize the project.
- use `terraform apply`to create the core resources. (You can pass .tfvars file using `--var-file` option with terraform apply command. ) 

**note: If you change the output_path, Make sure the path exist. Script will generate a zip of a serverless function and store it on output_path.**
 
**note:`ebs_app_name` & `repository_name` variables used in phase 2 are created in phase 1. Make sure their values are same in both phases.**
 
 
 AWS Resources that will be created by this script.
 
 -  Elastic beanstalk environment
 -  RDS (postgres)
 -  Step function 
 -  Lambda function
 -  Elastic Load Balancer
 -  Auto scaling group
 -  CICD pipeline to build a Docker image from source code in AWS Code commit and then deploy it to created EBS app.
 
 
 
**CICD Pipeline info: AWS Code Commit -> ECR (Docker image) -> Elastic Beanstalk**.

The module gets the code from a ``AWS CODECOMMIT`` repository, builds a ``Docker`` image from it by executing the ``buildspec.yml`` and ``Dockerfile`` files from the repository,
pushes the ``Docker`` image to an ``ECR`` repository, and deploys the ``Docker`` image to ``Elastic Beanstalk`` running ``Docker`` stack.
    - http://docs.aws.amazon.com/codebuild/latest/userguide/sample-docker.html
    
 
 # variables
 | Name | Description | Type |
|------|-------------|-------------|
| **current_directory** | name of the folder holding main.tf| varchar|
| aws_region | aws region | varchar|
| **environment** | deployment environment name | varchar|
| prefix | prefix to be attached to all resources | varchar|
| app_version | Application version| varchar|
| aws_profile | aws profile name| varchar|
| allocated_storage | Storage for RDS instance| number in GBs|
| engine_version | RDS engine version| number|
| identifier | RDS DB identifier | varchar|
| instance_class | RDS instance class| varchar|
| storage_type | RDS Storage type | varchar|
| multi_az | RDS instance multi_az value for high availabilty | boolean|
| app_instance_type | EC2 instance that will be created in EBS environment| varchar|
| ebs_app_name | EBS application name created in **core resources**| varchar|
| autoscaling_min_size | Minimum number of instances that can be in running state | number|
| autoscaling_max_size | Max number  of instances that can be in running state | number|
| GOOGLE_CLIENT_ID | google project id for upgrade client app | varchar|
| MONITOR_PASSWORD | Monitor password for upgrade service| varchar|
| SWAGGER_PASSWORD | Swagger password for upgrade service | varchar|
| repository_name | AWS CODE COMMIT repository name created in **core resources** for CICD pipeline| varchar|
| **branch_name** | AWS CODE COMMIT branch name for CICD pipeline | varchar|
| build_image | build image for AWS CODEBUILD| varchar|
| build_compute_type | AWS CODEBUILD Compute type| varchar|
| privileged_mode | codebuild priviledge mode | number|

`Note:  The variables marked as bold must be changed to create new environments.`


## Outputs

| Name | Description |
|------|-------------|
| ebs_cname | Public URL of the EBS app|
| step_function | Step function ARN |
