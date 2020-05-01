resource "aws_key_pair" "mykeypair" {
  count = length(var.environment)
  key_name   = "${var.environment[count.index]}-${var.prefix}-mykeypair"
  public_key = file(var.PATH_TO_PUBLIC_KEY)
  lifecycle {
    ignore_changes = [public_key]
  }
}

