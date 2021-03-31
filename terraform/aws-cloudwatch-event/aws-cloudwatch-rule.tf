resource "aws_cloudwatch_event_rule" "every_twelve_hour" {
    name = "${var.environment}-clear-lambda-logs-every-12-hour"
    description = "Fires every twelve hours"
    schedule_expression = "rate(12 hours)"
}