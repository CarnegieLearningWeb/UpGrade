output "website-s3-endpoint" {
  value = "${module.production.s3-bucket}"
}

output "website-cdn-endpoint" {
  value = "${module.production.s3-cdn}"
}