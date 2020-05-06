resource "aws_cloudwatch_event_rule" "every_twelve_hour" {
    name = "every_twelve_hour"
    description = "Fires every twelve hours"
    schedule_expression = "rate(5 minutes)"
}