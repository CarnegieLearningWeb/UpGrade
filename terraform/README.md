### terraform script for creating infrastructure for upgrade using docker image


# How to use it
Download and install [Terraform](https://www.terraform.io/downloads.html) & [EB CLI](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install-advanced.html) on your system.

Clone this repo using `https://github.com/CarnegieLearningWeb/educational-experiment-service.git` and then do `cd terraform`

Setup a aws provider profile using `aws configure`.

### `terraform` top-level directory layout explanation 
    .
    ├── aws-ebs-with-rds                   # terraform module to create ebs environment with POSTGRES installed
    ├── aws-lambda                         # terraform module to create Schedular lambda function
    ├── aws-step-fn                        # terraform module to create Schedular step function 
    ├── environments                        
        ├── dev                   
          ├── dev.tf                       # Config file for dev environment.
          ├── backend.tf                   # File that gives details of where to store tfstate files
        ├── staging                   
          ├── staging.tf                   # Config file for staging environment.
          ├── backend.tf                   # File that gives details of where to store tfstate files
          
          
 
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
 
 Once the environment setup is successfull, You can deploy docker image using eb-cli.
 
 Use `eb init` to initialize your app and then `eb deploy` using your docker file.
 
 
 # Sample Dockerrun.aws.json file
 
 ```JSON
{
  "AWSEBDockerrunVersion": "1",
  "Image": {
    "Name": "public docker image link or ECR docker image link",
    "Update": "true"
  },
  "Ports": [
    {
      "ContainerPort": "3030"
    }
  ],
  "Volumes": [],
  "Logging": "/var/log/eb-activity.log"
}
```
