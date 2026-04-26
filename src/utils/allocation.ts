import type {
  SubOrder,
  Customer,
  Warehouse,
  PriceRule,
  OrderType,
} from "../types";
import { getPrice } from "../data/mockData";

// Banker's rounding (round half to even)
export function bankersRound(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  const shifted = value * factor;
  const floor = Math.floor(shifted);
  const diff = shifted - floor;

  if (Math.abs(diff - 0.5) < Number.EPSILON) {
    // Exactly 0.5 — round to even
    return (floor % 2 === 0 ? floor : floor + 1) / factor;
  }
  return Math.round(shifted) / factor;
}

// Priority order for order types
const TYPE_PRIORITY: Record<OrderType, number> = {
  EMERGENCY: 0,
  OVERDUE: 1,
  DAILY: 2,
};

// Sort sub orders by priority: type first, then FIFO (oldest first)
export function sortByPriority(orders: SubOrder[]): SubOrder[] {
  return [...orders].sort((a, b) => {
    const typeDiff = TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type];
    if (typeDiff !== 0) return typeDiff;
    return a.createDate.getTime() - b.createDate.getTime();
  });
}

export function getBestWarehouse(
  warehouseId: string,
  warehouses: Map<string, Warehouse>,
): Warehouse | null {
  if (warehouseId !== "WH-000") {
    return warehouses.get(warehouseId) ?? null;
  }
  // WH-000 = any: pick warehouse with highest remaining stock (excluding WH-000 itself)
  let best: Warehouse | null = null;
  for (const [id, wh] of warehouses) {
    if (id === "WH-000") continue;
    if (!best || wh.stock > best.stock) best = wh;
  }
  return best;
}

export function autoAllocate(
  subOrders: SubOrder[],
  customers: Map<string, Customer>,
  warehouses: Map<string, Warehouse>,
  priceRules: PriceRule[],
): SubOrder[] {
  const sorted = sortByPriority(subOrders);
  const customerMap = new Map(
    Array.from(customers).map(([k, v]) => [k, { ...v }]),
  );
  const warehouseMap = new Map(
    Array.from(warehouses).map(([k, v]) => [k, { ...v }]),
  );

  const result: SubOrder[] = sorted.map((order) => {
    const customer = customerMap.get(order.customerId);
    if (!customer) return { ...order, allocatedQty: 0 };

    const warehouse = getBestWarehouse(order.warehouseId, warehouseMap);
    if (!warehouse || warehouse.stock <= 0)
      return { ...order, allocatedQty: 0 };

    const price = getPrice(
      order.itemId,
      order.supplierId,
      order.type,
      priceRules,
    );
    const creditAvailable = customer.creditLimit - customer.creditUsed;
    const maxByCredit =
      price > 0 ? Math.floor(creditAvailable / price) : order.requestQty;
    const maxByStock = warehouse.stock;

    const canAllocate = Math.min(order.requestQty, maxByCredit, maxByStock);
    const allocated = bankersRound(Math.max(0, canAllocate));

    // Deduct from warehouse stock and customer credit
    warehouse.stock -= allocated;
    customer.creditUsed += bankersRound(allocated * price);

    // Sync back
    warehouseMap.set(warehouse.id, warehouse);
    customerMap.set(customer.id, customer);

    return { ...order, allocatedQty: allocated };
  });

  // Return in original order (re-sort by original id)
  const resultMap = new Map(result.map((o) => [o.id, o]));
  return subOrders.map((o) => resultMap.get(o.id) ?? o);
}

export function validateManualAllocation(
  order: SubOrder,
  newQty: number,
  customers: Map<string, Customer>,
  warehouses: Map<string, Warehouse>,
  priceRules: PriceRule[],
): { valid: boolean; error?: string } {
  if (newQty < 0) return { valid: false, error: "Quantity cannot be negative" };
  if (newQty > order.requestQty)
    return {
      valid: false,
      error: `Cannot exceed requested qty (${order.requestQty})`,
    };

  const warehouse = getBestWarehouse(order.warehouseId, warehouses);
  if (!warehouse) return { valid: false, error: "No warehouse available" };

  const stockDiff = newQty - order.allocatedQty;
  if (stockDiff > warehouse.stock) {
    return {
      valid: false,
      error: `Insufficient stock (available: ${warehouse.stock})`,
    };
  }

  const customer = customers.get(order.customerId);
  if (!customer) return { valid: false, error: "Customer not found" };

  const price = getPrice(
    order.itemId,
    order.supplierId,
    order.type,
    priceRules,
  );
  const additionalCost = bankersRound(stockDiff * price);
  const creditAvailable = customer.creditLimit - customer.creditUsed;

  if (additionalCost > creditAvailable) {
    return {
      valid: false,
      error: `Exceeds credit limit (available: ${creditAvailable.toFixed(2)})`,
    };
  }

  return { valid: true };
}
