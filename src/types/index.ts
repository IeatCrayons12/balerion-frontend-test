export type OrderType = 'EMERGENCY' | 'OVERDUE' | 'DAILY';

export interface SubOrder {
  id: string;           // e.g. ORDER-0001-001
  orderId: string;      // e.g. ORDER-0001
  itemId: string;
  warehouseId: string;  // WH-000 = any
  supplierId: string;   // SP-000 = any
  requestQty: number;
  allocatedQty: number;
  type: OrderType;
  createDate: Date;
  customerId: string;
  remark?: string;
}

export interface Customer {
  id: string;
  name: string;
  creditLimit: number;
  creditUsed: number;
}

export interface Warehouse {
  id: string;
  stock: number; // remaining stock
}

export interface Supplier {
  id: string;
  name: string;
}

export interface PriceRule {
  itemId: string;
  supplierId: string;
  basePrice: number;
  tiers: {
    EMERGENCY: number; // multiplier e.g. 1.25
    OVERDUE: number;
    DAILY: number;
  };
}

export interface AllocationStore {
  subOrders: SubOrder[];
  customers: Map<string, Customer>;
  warehouses: Map<string, Warehouse>;
  suppliers: Supplier[];
  priceRules: PriceRule[];
}

export type FilterType = 'ALL' | OrderType;