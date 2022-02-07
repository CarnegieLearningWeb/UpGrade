
output "step_function_arn" {
  value = "${aws_sfn_state_machine.upgrade-experimentScheduler-sfn.id}"
}
