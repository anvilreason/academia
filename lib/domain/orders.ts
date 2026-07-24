export type OrderStatus = "pending" | "paid" | "cancelled" | "refunded";

export function canTransitionOrder(
  from: OrderStatus,
  to: OrderStatus,
  paymentMode: "test" | "production",
) {
  if (from === to) return true;
  if (from === "pending" && to === "cancelled") return true;
  if (from === "paid" && to === "refunded") return true;
  if (from === "pending" && to === "paid") return paymentMode === "test";
  return false;
}

export function nodePriceFen(nodeSlug: string) {
  if (nodeSlug === "porter-five-forces") return 9_900;
  if (nodeSlug === "disruptive-innovation") return 9_900;
  return 0;
}
