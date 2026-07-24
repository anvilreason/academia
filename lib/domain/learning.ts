export function progressForTurn(nodeSlug: string, turnCount: number) {
  const step = nodeSlug === "porter-five-forces" ? 25 : 20;
  return Math.min(100, turnCount * step);
}

export function canCompleteNode(nodeSlug: string, turnCount: number) {
  if (nodeSlug === "porter-five-forces") return turnCount >= 4;
  return turnCount >= 5;
}

export function mayAccessNode(input: {
  nodeSlug: string;
  userId: string | null;
  hasEntitlement: boolean;
}) {
  if (input.nodeSlug === "4p-stp") return true;
  return Boolean(input.userId && input.hasEntitlement);
}
