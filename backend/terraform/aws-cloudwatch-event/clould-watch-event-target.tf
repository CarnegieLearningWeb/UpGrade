resource "aws_cloudwatch_event_target" "clear_logs_after_twelve_hours" {
    rule = aws_cloudwatch_event_rule.every_twelve_hour.name
    target_id = "test-checking-scheduler"
    arn = var.lambda_arn
    input = <<DOC
    {
        "url": "http://${var.host_url}/api/scheduledJobs/clearLogs",
        "body": {
            "logTypes": [
            "audit-logs",
            "error-logs"
            ]
        }
    }
    DOC
}