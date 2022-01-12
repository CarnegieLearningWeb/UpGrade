# ---------------------------------------------------------------------------------------------------------------------
# CREATE SUBNET GROUP FOR POSTGRES USING CONFIGURED VPC
# ---------------------------------------------------------------------------------------------------------------------


resource "aws_db_subnet_group" "postgres-subnet" {
  
  name        = "${var.environment}-${var.prefix}-${var.engine}-subnet"
  description = "RDS subnet group"
  subnet_ids  = [aws_subnet.main-private-1.id, aws_subnet.main-private-2.id]
}

# DB params 
resource "aws_db_parameter_group" "postgres-parameters" {
  
  name        = "${var.environment}-${var.prefix}-${var.engine}-parameters"
  family      = var.rds_family
  description = "postgres parameter group"
}

# Create DB
resource "aws_db_instance" "app-rds" {
  
  allocated_storage         = var.allocated_storage
  engine                    = var.engine
  engine_version            = var.engine_version
  instance_class            = var.instance_class
  identifier                = "${var.environment}-${var.prefix}-${var.identifier}"
  name                      = var.RDS_DB_NAME
  username                  = var.RDS_USERNAME
  password                  = var.RDS_PASSWORD
  db_subnet_group_name      = aws_db_subnet_group.postgres-subnet.name
  parameter_group_name      = aws_db_parameter_group.postgres-parameters.name
  multi_az                  = var.multi_az  
  vpc_security_group_ids    = [aws_security_group.allow-rds.id]
  storage_type              = var.storage_type
  backup_retention_period   = 30
  availability_zone         = aws_subnet.main-private-1.availability_zone
  skip_final_snapshot       = true
  final_snapshot_identifier = "${var.environment}-${var.prefix}-${var.engine}-snapshot"
  tags = {
    Name = "${var.environment}-${var.prefix}-rds-instance"
  }
}

# Create Read Replica DB
resource "aws_db_instance" "app-rds-read-replica" {
  count                       = length(var.replica_names)  # Number of read replicas to create
  name                        = var.replica_names[count.index]
  allocated_storage           = var.allocated_storage
  engine                      = var.engine
  engine_version              = var.engine_version
  instance_class              = var.instance_class
  identifier                  = "${var.environment}-${var.prefix}-${var.identifier}-read-replica-${count.index}"
  replicate_source_db         = aws_db_instance.app-rds.id
  multi_az                    = var.multi_az  
  vpc_security_group_ids      = [aws_security_group.allow-rds.id]
  storage_type                = var.storage_type
  # disable backups to create DB faster
  backup_retention_period     = 0
  skip_final_snapshot         = true
}
