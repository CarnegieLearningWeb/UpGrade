export function formatDecisionPointDisplay(decisionPoint: { site: string; target: string }): string {
  return decisionPoint.target ? `${decisionPoint.site} (${decisionPoint.target})` : decisionPoint.site;
}
