resource "aws_elastic_beanstalk_environment" "upgrade-app-prod" {  
  name                = "${var.environment}-${var.prefix}-experiment-app"
  application         = var.ebs_app_name
  solution_stack_name = "64bit Amazon Linux 2 v3.4.4 running Docker"
  setting {
    namespace = "aws:ec2:vpc"
    name      = "VPCId"
    value     = aws_vpc.main.id
  }
  setting {
    namespace = "aws:ec2:vpc"
    name      = "AssociatePublicIpAddress"
    value     = "false"
  }
  setting {
    namespace = "aws:ec2:vpc"
    name      = "Subnets"
    value     = "${aws_subnet.main-private-1.id},${aws_subnet.main-private-2.id}"
  }
  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "IamInstanceProfile"
    value     = aws_iam_instance_profile.app-ec2-role.name
  }
  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "SecurityGroups"
    value     = aws_security_group.app-prod.id
  }
  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "EC2KeyName"
    value     = aws_key_pair.mykeypair.id
  }
  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "InstanceType"
    value     = var.app_instance_type
  }
  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "ServiceRole"
    value     = aws_iam_role.elasticbeanstalk-service-role.name
  }
  setting {
    namespace = "aws:ec2:vpc"
    name      = "ELBScheme"
    value     = "public"
  }
  setting {
    namespace = "aws:ec2:vpc"
    name      = "ELBSubnets"
    value     = "${aws_subnet.main-public-1.id},${aws_subnet.main-public-2.id}"
  }
  setting {
    namespace = "aws:elb:loadbalancer"
    name      = "CrossZone"
    value     = "true"
  }
    setting {
    namespace = "aws:elb:listener:443"
    name      = "ListenerProtocol"
    value     = "HTTPS"
  }
  setting {
    namespace = "aws:elb:listener:443"
    name      = "InstancePort"
    value     = 80
  }
  setting {
    namespace = "aws:elb:listener:443"
    name      = "InstanceProtocol"
    value     = "HTTP"
  }
  setting {
    namespace = "aws:elb:listener:443"
    name      = "SSLCertificateId"
    value     = var.ssl_certificate_id
  }
   setting {
    namespace = "aws:elasticbeanstalk:cloudwatch:logs"
    name      = "StreamLogs"
    value     = "true"
  }
  setting {
    namespace = "aws:elasticbeanstalk:command"
    name      = "BatchSize"
    value     = "30"
  }
  setting {
    namespace = "aws:elasticbeanstalk:command"
    name      = "BatchSizeType"
    value     = "Percentage"
  }
  setting {
    namespace = "aws:autoscaling:asg"
    name      = "Availability Zones"
    value     = "Any 2"
  }
  setting {
    namespace = "aws:autoscaling:asg"
    name      = "MinSize"
    value     = var.autoscaling_min_size
  }
  setting {
    namespace = "aws:autoscaling:asg"
    name      = "MaxSize"
    value     = var.autoscaling_max_size
  }
  setting {
    namespace = "aws:autoscaling:updatepolicy:rollingupdate"
    name      = "RollingUpdateType"
    value     = "Health"
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "ADMIN_USERS"
    value     = var.ADMIN_USERS
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "APP_BANNER"
    value     = var.APP_BANNER
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "APP_HOST"
    value     = var.APP_HOST
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "APP_NAME"
    value     = var.APP_NAME
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "APP_PORT"
    value     = var.APP_PORT
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "APP_ROUTE_PREFIX"
    value     = var.APP_ROUTE_PREFIX
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "APP_SCHEMA"
    value     = var.APP_SCHEMA
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "AUTH_CHECK"
    value     = var.AUTH_CHECK
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "AWS_REGION"
    value     = var.AWS_REGION
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "CLIENT_API_KEY"
    value     = var.CLIENT_API_KEY
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "CLIENT_API_SECRET"
    value     = var.CLIENT_API_SECRET
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "CONTEXT_METADATA"
    value     = var.CONTEXT_METADATA
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "METRIC"
    value     = var.METRIC
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "CONTROLLERS"
    value     = var.CONTROLLERS
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DOMAIN_NAME"
    value     = var.DOMAIN_NAME
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "EMAIL_BUCKET"
    value     = var.EMAIL_BUCKET
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "EMAIL_EXPIRE_AFTER_SECONDS"
    value     = var.EMAIL_EXPIRE_AFTER_SECONDS
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "EMAIL_FROM"
    value     = var.EMAIL_FROM
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "GOOGLE_CLIENT_ID"
    value     = var.GOOGLE_CLIENT_ID
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "HOST_URL"
    value     = var.HOST_URL
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "INTERCEPTORS"
    value     = var.INTERCEPTORS
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "LOG_LEVEL"
    value     = var.LOG_LEVEL
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "LOG_OUTPUT"
    value     = var.LOG_OUTPUT
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "MIDDLEWARES"
    value     = var.MIDDLEWARES
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "MONITOR_ENABLED"
    value     = var.MONITOR_ENABLED
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "MONITOR_PASSWORD"
    value     = var.MONITOR_PASSWORD
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "MONITOR_ROUTE"
    value     = var.MONITOR_ROUTE
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "MONITOR_USERNAME"
    value     = var.MONITOR_USERNAME
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "NEW_RELIC_APP_NAME"
    value     = var.NEW_RELIC_APP_NAME
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "NEW_RELIC_LICENSE_KEY"
    value     = var.NEW_RELIC_LICENSE_KEY
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "RDS_DB_NAME"
    value     = aws_db_instance.app-rds.name
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "RDS_HOSTNAME"
    value     = split(":", aws_db_instance.app-rds.endpoint)[0]
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "RDS_HOSTNAME_REPLICAS"
    value     = jsonencode([for endPoint in aws_db_instance.app-rds-read-replica.*.endpoint : split(":", endPoint)[0]])
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "RDS_PASSWORD"
    value     = aws_db_instance.app-rds.password
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "RDS_PORT"
    value     = split(":", aws_db_instance.app-rds.endpoint)[1]
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "RDS_USERNAME"
    value     = aws_db_instance.app-rds.username
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "SCHEDULER_STEP_FUNCTION"
    value     = var.SCHEDULER_STEP_FUNCTION
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "SWAGGER_API"
    value     = var.SWAGGER_API
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "SWAGGER_ENABLED"
    value     = var.SWAGGER_ENABLED
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "SWAGGER_FILE"
    value     = var.SWAGGER_FILE
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "SWAGGER_PASSWORD"
    value     = var.SWAGGER_PASSWORD
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "SWAGGER_ROUTE"
    value     = var.SWAGGER_ROUTE
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "SWAGGER_USERNAME"
    value     = var.SWAGGER_USERNAME
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "TOKEN_SECRET_KEY"
    value     = var.TOKEN_SECRET_KEY
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "TYPEORM_CONNECTION"
    value     = var.TYPEORM_CONNECTION
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "TYPEORM_ENTITIES"
    value     = var.TYPEORM_ENTITIES
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "TYPEORM_HOST"
    value     = var.TYPEORM_HOST
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "TYPEORM_HOSTNAME_REPLICAS"
    value     = var.TYPEORM_HOSTNAME_REPLICAS
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "TYPEORM_ENTITIES_DIR"
    value     = var.TYPEORM_ENTITIES_DIR
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "TYPEORM_FACTORY"
    value     = var.TYPEORM_FACTORY
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "TYPEORM_LOGGER"
    value     = var.TYPEORM_LOGGER
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "TYPEORM_MAX_QUERY_EXECUTION_TIME"
    value     = var.TYPEORM_MAX_QUERY_EXECUTION_TIME
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "TYPEORM_LOGGING"
    value     = var.TYPEORM_LOGGING
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "TYPEORM_MIGRATIONS"
    value     = var.TYPEORM_MIGRATIONS
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "TYPEORM_MIGRATIONS_DIR"
    value     = var.TYPEORM_MIGRATIONS_DIR
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "TYPEORM_SEED"
    value     = var.TYPEORM_SEED
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "TYPEORM_SYNCHRONIZE"
    value     = var.TYPEORM_SYNCHRONIZE
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "NODE_OPTIONS"
    value     = var.NODE_OPTIONS   
  }
}

output "rds-endpoints" {
  value = jsonencode([for endPoint in aws_db_instance.app-rds-read-replica.*.endpoint : split(":", endPoint)[0]])
}