import { useReducer, useEffect, useMemo, useState } from "react";
import type {
  AllocationStore,
  FilterType,
} from "../types";
import { generateMockData } from "../data/mockData";
import {
  autoAllocate,
  validateManualAllocation,
  bankersRound,
} from "../utils/allocation";
import { getPrice } from "../data/mockData";

type Action =
  | { type: "INIT"; payload: AllocationStore }
  | { type: "AUTO_ALLOCATE" }
  | { type: "MANUAL_ALLOCATE"; payload: { orderId: string; qty: number } };

interface State extends AllocationStore {
  initialized: boolean;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "INIT":
      return { ...state, ...action.payload, initialized: true };

    case "AUTO_ALLOCATE": {
      const allocated = autoAllocate(
        state.subOrders,
        state.customers,
        state.warehouses,
        state.priceRules,
      );
      // Recompute customer credit used
      const customers = new Map(
        Array.from(state.customers).map(([k, v]) => [
          k,
          { ...v, creditUsed: 0 },
        ]),
      );
      const warehouses = new Map(
        Array.from(state.warehouses).map(([k, v]) => [k, { ...v }]),
      );

      for (const order of allocated) {
        const price = getPrice(
          order.itemId,
          order.supplierId,
          order.type,
          state.priceRules,
        );
        const customer = customers.get(order.customerId);
        if (customer) {
          customer.creditUsed = bankersRound(
            customer.creditUsed + order.allocatedQty * price,
          );
        }
        if (order.allocatedQty > 0) {
          const wh =
            warehouses.get(order.warehouseId) ??
            Array.from(warehouses.values()).sort(
              (a, b) => b.stock - a.stock,
            )[0];
          if (wh) wh.stock = Math.max(0, wh.stock - order.allocatedQty);
        }
      }

      return { ...state, subOrders: allocated, customers, warehouses };
    }

    case "MANUAL_ALLOCATE": {
      const { orderId, qty } = action.payload;
      const order = state.subOrders.find((o) => o.id === orderId);
      if (!order) return state;

      const validation = validateManualAllocation(
        order,
        qty,
        state.customers,
        state.warehouses,
        state.priceRules,
      );
      if (!validation.valid) return state;

      const diff = qty - order.allocatedQty;
      const price = getPrice(
        order.itemId,
        order.supplierId,
        order.type,
        state.priceRules,
      );

      const customers = new Map(state.customers);
      const customer = customers.get(order.customerId);
      if (customer) {
        customers.set(order.customerId, {
          ...customer,
          creditUsed: bankersRound(customer.creditUsed + diff * price),
        });
      }

      const warehouses = new Map(state.warehouses);
      const whKey =
        order.warehouseId === "WH-000"
          ? Array.from(warehouses.entries())
              .filter(([k]) => k !== "WH-000")
              .sort(([, a], [, b]) => b.stock - a.stock)[0]?.[0]
          : order.warehouseId;
      if (whKey) {
        const wh = warehouses.get(whKey);
        if (wh)
          warehouses.set(whKey, { ...wh, stock: Math.max(0, wh.stock - diff) });
      }

      const subOrders = state.subOrders.map((o) =>
        o.id === orderId ? { ...o, allocatedQty: qty } : o,
      );

      return { ...state, subOrders, customers, warehouses };
    }

    default:
      return state;
  }
}

const initialState: State = {
  subOrders: [],
  customers: new Map(),
  warehouses: new Map(),
  suppliers: [],
  priceRules: [],
  initialized: false,
};

export function useAllocationStore() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("ALL");

  useEffect(() => {
    const data = generateMockData();
    dispatch({ type: "INIT", payload: data });
    // Auto-allocate on page load (slight delay for UX)
    setTimeout(() => dispatch({ type: "AUTO_ALLOCATE" }), 100);
  }, []);

  const filteredOrders = useMemo(() => {
    let orders = state.subOrders;
    if (filterType !== "ALL") {
      orders = orders.filter((o) => o.type === filterType);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      orders = orders.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.orderId.toLowerCase().includes(q) ||
          o.customerId.toLowerCase().includes(q) ||
          o.itemId.toLowerCase().includes(q),
      );
    }
    return orders;
  }, [state.subOrders, search, filterType]);

  const totalStock = useMemo(() => {
    return Array.from(state.warehouses.values())
      .filter((w) => w.id !== "WH-000")
      .reduce((sum, w) => sum + w.stock, 0);
  }, [state.warehouses]);

  const stats = useMemo(() => {
    const total = state.subOrders.length;
    const allocated = state.subOrders.filter((o) => o.allocatedQty > 0).length;
    const fullyAllocated = state.subOrders.filter(
      (o) => o.allocatedQty >= o.requestQty,
    ).length;
    const emergency = state.subOrders.filter(
      (o) => o.type === "EMERGENCY",
    ).length;
    return { total, allocated, fullyAllocated, emergency };
  }, [state.subOrders]);

  const manualAllocate = (orderId: string, qty: number) => {
    dispatch({ type: "MANUAL_ALLOCATE", payload: { orderId, qty } });
  };

  const validate = (orderId: string, qty: number) => {
    const order = state.subOrders.find((o) => o.id === orderId);
    if (!order) return { valid: false, error: "Order not found" };
    return validateManualAllocation(
      order,
      qty,
      state.customers,
      state.warehouses,
      state.priceRules,
    );
  };

  return {
    ...state,
    filteredOrders,
    totalStock,
    stats,
    search,
    setSearch,
    filterType,
    setFilterType,
    manualAllocate,
    validate,
  };
}
