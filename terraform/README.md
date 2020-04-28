### terraform script for creating infrastructure for upgrade and setting up CICD pipeline using AWS codepipeline


# Before you use...
- Download and install [Terraform](https://www.terraform.io/downloads.html) on your system.
- Install & Configure [aws-cli](https://docs.aws.amazon.com/cli/latest/userguide/install-windows.html) on your system.
- Setup a aws provider profile using `aws configure`
- Create a s3 Bucket to store `tfstate` files remotely. We recommend enable versioning on that bucket.
>   aws s3api create-bucket --acl private --bucket terraform-artifacts-bucket

>   aws s3api put-bucket-versioning --bucket terraform-artifacts-bucket --versioning-configuration Status=Enabled



Clone this repo using `https://github.com/CarnegieLearningWeb/educational-experiment-service.git` and then do `cd terraform`


### `terraform` top-level directory layout explanation 
    .
    ├── aws-ebs-with-rds                   # terraform module to create ebs environment with POSTGRES installed
    ├── aws-lambda                         # terraform module to create Schedular lambda function
    ├── aws-step-fn                        # terraform module to create Schedular step function 
    ├── environments                        
        ├── dev                   
          ├── dev.tf                       # Config file for dev environment.
          ├── backend.tf                   # File that gives details of where to store tfstate files
          ├── variables.tf                 # Gives info about varibles required 
        ├── staging                   
          ├── staging.tf                   # Config file for staging environment.
          ├── backend.tf                   # File that gives details of where to store tfstate files
          ├── variables.tf                 # Gives info about varibles required 
          
          
 
 Generate ssh key using `ssh-keygen -f mykey` (if you generate it with a different name, make sure to replace variables accordingly )
 
 
 - use `terraform init`to initialize the project (Make sure you create a bucket with a name specified in backend.tf file before executing this command)
 
 - `terraform apply` inside `environment/dev` or `environment/staging`  to create dev and staging infrastructure respectively. You can pass .tfvars file using `--var-file` option.
 
 
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
    
    
 # Sample code file to build infrastructure and setup CICD
 
 ```hcl
# 1. Create lambda function 
module "aws_lambda_function" {

  source                =  "../../aws-lambda"

  environment           = var.environment 
  prefix                = var.prefix 
  app_version           = var.app_version 
  lambda_path           = "../../packages/Schedular"  //Path of the lambda function 
  output_path           = "../environments/dev/.terraform" 
  function_name         = "Schedule" 
  function_handler      = "schedule.schedule"
  runtime               =  "nodejs10.x"
}

# 2. Create state machine 
module "aws-state-machine" {

  source                = "../../aws-step-fn"

  environment           = var.environment 
  prefix                = var.prefix 
  app_version           = var.app_version 
  aws_region            = var.aws_region
  lambda_arn            = module.aws_lambda_function.lambda-arn[0] // uses lambda function created above
}


# 3. Create beanstalk application
module "aws-ebs-app" {

  source                = "../../aws-ebs-with-rds"

  environment           = var.environment
  prefix                = var.prefix 

  # RDS
  # https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html
  allocated_storage     = 100
  engine_version        = var.engine_version    // "11.5"
  identifier            = var.identifier
  instance_class        = var.instance_class
  storage_type          = var.storage_type
  multi_az              = "false"
  
  # EBS config
  # https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/command-options-general.html
  app_instance_type     = var.app_instance_type
  autoscaling_min_size  = var.autoscaling_min_size
  autoscaling_max_size  = var.autoscaling_max_size

  # APP env config
  GOOGLE_CLIENT_ID      = var.GOOGLE_CLIENT_ID
  MONITOR_PASSWORD      = var.MONITOR_PASSWORD  
  SWAGGER_PASSWORD      = var.SWAGGER_PASSWORD 
  
  SCHEDULER_STEP_FUNCTION = module.aws-state-machine.step_function_arn
  PATH_TO_PRIVATE_KEY     = "~/.ssh/id_rsa"
  PATH_TO_PUBLIC_KEY      = "~/.ssh/id_rsa.pub"
}

module "aws-code-pipeline"{

  source = "../../aws-codepipeline"

  environment           = var.environment 
  prefix                = var.prefix 
  aws_region            = var.aws_region

  # Application repository on AWS CODECOMMIT 
  repository_name       = var.repository_name
  branch_name           = var.branch_name

  # CODE BUILD variables
  # http://docs.aws.amazon.com/codebuild/latest/userguide/build-env-ref.html
  # http://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html
  build_image           = var.build_image
  build_compute_type    = var.build_compute_type
  privileged_mode       = var.privileged_mode

  # Elastic Beanstalk app created aboce
  ebs_app_name          = module.aws-ebs-app.ebs-env
  ebs_env_name          = module.aws-ebs-app.application
}
```

## Outputs

| Name | Description |
|------|-------------|
| ebs_cname | Public URL of the EBS app|
| step_function | Step function ARN |
