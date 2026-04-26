import type { SubOrder, Customer, Warehouse, Supplier, PriceRule, OrderType } from '../types';

const ORDER_TYPES: OrderType[] = ['EMERGENCY', 'OVERDUE', 'DAILY'];
const ITEMS = ['Item-1', 'Item-2', 'Item-3'];
const WAREHOUSE_IDS = ['WH-000', 'WH-001', 'WH-002', 'WH-003'];
const SUPPLIER_IDS = ['SP-000', 'SP-001', 'SP-002', 'SP-003'];

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function pad(n: number, digits = 4) {
  return String(n).padStart(digits, '0');
}

export function generateMockData() {
  const NUM_ORDERS = 200;        // parent orders
  const NUM_CUSTOMERS = 50;
  const NUM_WAREHOUSES = 4;

  // Customers
  const customers = new Map<string, Customer>();
  for (let i = 1; i <= NUM_CUSTOMERS; i++) {
    const id = `CT-${pad(i)}`;
    customers.set(id, {
      id,
      name: `Customer ${i}`,
      creditLimit: randomBetween(50000, 500000),
      creditUsed: 0,
    });
  }

  // Warehouses
  const warehouses = new Map<string, Warehouse>();
  warehouses.set('WH-000', { id: 'WH-000', stock: 999999 }); // virtual "any"
  for (let i = 1; i <= NUM_WAREHOUSES; i++) {
    const id = `WH-${pad(i, 3)}`;
    warehouses.set(id, { id, stock: randomBetween(5000, 50000) });
  }

  // Suppliers
  const suppliers: Supplier[] = [
    { id: 'SP-000', name: 'Any Supplier' },
    { id: 'SP-001', name: 'Nordic Salmon Co.' },
    { id: 'SP-002', name: 'Pacific Fresh Ltd.' },
    { id: 'SP-003', name: 'Arctic Blue Farms' },
  ];

  // Price rules
  const priceRules: PriceRule[] = [
    {
      itemId: 'Item-1',
      supplierId: 'SP-001',
      basePrice: 99.75,
      tiers: { EMERGENCY: 1.25, OVERDUE: 1.0, DAILY: 0.9 },
    },
    {
      itemId: 'Item-1',
      supplierId: 'SP-002',
      basePrice: 95.0,
      tiers: { EMERGENCY: 1.25, OVERDUE: 1.0, DAILY: 0.9 },
    },
    {
      itemId: 'Item-2',
      supplierId: 'SP-001',
      basePrice: 110.0,
      tiers: { EMERGENCY: 1.25, OVERDUE: 1.0, DAILY: 0.9 },
    },
    {
      itemId: 'Item-2',
      supplierId: 'SP-003',
      basePrice: 105.5,
      tiers: { EMERGENCY: 1.25, OVERDUE: 1.0, DAILY: 0.9 },
    },
    {
      itemId: 'Item-3',
      supplierId: 'SP-002',
      basePrice: 88.0,
      tiers: { EMERGENCY: 1.25, OVERDUE: 1.0, DAILY: 0.9 },
    },
  ];

  // Sub orders
  const subOrders: SubOrder[] = [];
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2025-03-01');
  const customerIds = Array.from(customers.keys());

  let subOrderCounter = 1;

  for (let i = 1; i <= NUM_ORDERS; i++) {
    const orderId = `ORDER-${pad(i)}`;
    const numSubs = randomBetween(1, 4);
    const customerId = customerIds[randomBetween(0, customerIds.length - 1)];
    const orderDate = randomDate(startDate, endDate);

    for (let j = 1; j <= numSubs; j++) {
      const type = ORDER_TYPES[randomBetween(0, 2)];
      const supplierId = SUPPLIER_IDS[randomBetween(0, SUPPLIER_IDS.length - 1)];
      const warehouseId = WAREHOUSE_IDS[randomBetween(0, WAREHOUSE_IDS.length - 1)];
      const itemId = ITEMS[randomBetween(0, ITEMS.length - 1)];

      subOrders.push({
        id: `ORDER-${pad(i)}-${pad(j, 3)}`,
        orderId,
        itemId,
        warehouseId,
        supplierId,
        requestQty: randomBetween(10, 500),
        allocatedQty: 0,
        type,
        createDate: orderDate,
        customerId,
        remark: type === 'EMERGENCY' ? 'Special for VIP' : '',
      });
      subOrderCounter++;
    }
  }

  return { subOrders, customers, warehouses, suppliers, priceRules };
}

export function getPrice(
  itemId: string,
  supplierId: string,
  type: OrderType,
  priceRules: PriceRule[]
): number {
  const rule = priceRules.find(
    (r) => r.itemId === itemId && (r.supplierId === supplierId || supplierId === 'SP-000')
  ) ?? priceRules.find((r) => r.itemId === itemId);

  if (!rule) return 0;
  return rule.basePrice * rule.tiers[type];
}