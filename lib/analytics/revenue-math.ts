export type RevenueOrder = {
  userId: string;
  amountFen: number;
  status: string;
  paymentMode: string;
};

export function calculateRevenueMetrics(
  registeredUsers: number,
  orders: RevenueOrder[],
) {
  const production = orders.filter(
    (order) => order.paymentMode === "production",
  );
  const settled = production.filter((order) =>
    ["paid", "refunded"].includes(order.status),
  );
  const paid = production.filter((order) => order.status === "paid");
  const refunded = production.filter((order) => order.status === "refunded");
  const paidByUser = new Map<string, number>();
  for (const order of paid) {
    paidByUser.set(
      order.userId,
      (paidByUser.get(order.userId) ?? 0) + 1,
    );
  }
  const netRevenueFen = paid.reduce(
    (total, order) => total + order.amountFen,
    0,
  );
  const grossRevenueFen = settled.reduce(
    (total, order) => total + order.amountFen,
    0,
  );
  const refundedFen = refunded.reduce(
    (total, order) => total + order.amountFen,
    0,
  );
  const payerCount = paidByUser.size;
  const repeatPayers = [...paidByUser.values()].filter(
    (count) => count >= 2,
  ).length;

  return {
    grossRevenueFen,
    refundedFen,
    netRevenueFen,
    payerCount,
    paidOrders: paid.length,
    conversionRate: registeredUsers
      ? Math.round((payerCount / registeredUsers) * 10_000) / 100
      : 0,
    arpuFen: registeredUsers
      ? Math.round(netRevenueFen / registeredUsers)
      : 0,
    arppuFen: payerCount ? Math.round(netRevenueFen / payerCount) : 0,
    repeatRate: payerCount
      ? Math.round((repeatPayers / payerCount) * 10_000) / 100
      : 0,
  };
}
