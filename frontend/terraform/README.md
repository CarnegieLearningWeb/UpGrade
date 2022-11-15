### Deployment Overview

- Phase 1 - Create core resources shared by all environments:
- Phase 2 - Create resources for frontend

### Phase 1 - Core Resources

- Change Directory - `cd terraform/core`
- Edit - `backend.tf` - replace the tfstate bucket, path, and aws profile name.
- Edit - `core.tf` - replace aws profile name.
- Copy - `cp tfvars.sample core.auto.tfvars` - change [variables](#variables) if necessary. All \*.auto.tfvars are used automatically by terraform.
- Run - `terraform init` to initialize the project.
- Run - `terraform apply` to create the core resources.
- Confirm - Terraform will show the list of resources it plans to create. Review them and enter `yes`.

( Note: You can use `terraform destroy` to terminate and delete all the resources created above. You can also delete one or more specific resources using resource names from `terraform state list` and providing resource names with -target flag `terraform destroy -target RESOURCE_TYPE.NAME1 -target RESOURCE_TYPE.NAME2`)

### Phase 2 - Environment-specific Resources

- Change Directory - `cd terraform/environments/<envname>`
- Edit - `backend.tf` - replace the tfstate bucket, path, and aws profile name.
- Copy - `cp tfvars.sample core.auto.tfvars` - change [variables](#variables) if necessary. All \*.auto.tfvars are used automatically by terraform.
- Run - `terraform init` to initialize the project.
- Run - `terraform apply` to create the core resources.
- Confirm - Terraform will show the list of resources it plans to create. Review them and enter `yes`.

( Note: You can use `terraform destroy` to terminate and delete all the resources created above. You can also delete one or more specific resources using resource names from `terraform state list` and providing resource names with -target flag `terraform destroy -target RESOURCE_TYPE.NAME1 -target RESOURCE_TYPE.NAME2`)