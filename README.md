# Balerion Frontend — Interview 12.1 (Allocation Problem)

An interactive salmon allocation interface built with React + TypeScript + MUI.

## Features

- **Auto-allocation on page load** — distributes stock across orders using priority rules (Emergency → Overdue → Daily), FIFO within each tier, Banker's rounding, and credit limit enforcement
- **Manual allocation** — click any row to open a side drawer, adjust quantity with real-time constraint validation (stock + credit limits)
- **Virtualized table** — handles 5,000+ orders smoothly using `@tanstack/react-virtual`
- **Search & filter** — filter by order type, search by order ID, sub-order ID, customer, or item
- **Live stats bar** — total orders, allocated count, fully allocated, emergency count, remaining stock

## Live Demo

https://balerion-frontend-test-1brx48lme-ieatcrayons12s-projects.vercel.app/

## Tech Stack

| Tool | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| MUI (Material UI) | Component library |
| @tanstack/react-virtual | Row virtualization for 5k+ orders |
| Vite | Build tool |

## Prerequisites

- Node.js 18+ (https://nodejs.org)
- npm 9+

Verify:
```bash
node -v   # v18.x or higher
npm -v    # 9.x or higher
```

## Setup & Run (from a fresh machine)

```bash
# 1. Clone the repo
git clone https://github.com/IeatCrayons12/balerion-frontend-test.git
cd balerion-frontend-test

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open http://localhost:5173 in your browser.

## Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── types/              # TypeScript interfaces (SubOrder, Customer, Warehouse, etc.)
├── data/
│   └── mockData.ts     # Mock data generator + price lookup
├── utils/
│   └── allocation.ts   # Auto-allocation algorithm, Banker's rounding, validation
├── hooks/
│   └── useAllocationStore.ts  # Central state management via useReducer
├── components/
│   ├── layout/
│   │   └── StatsBar.tsx       # Top stats cards
│   ├── orders/
│   │   ├── FilterBar.tsx      # Search + type filter
│   │   └── OrdersTable.tsx    # Virtualized orders table
│   └── allocation/
│       └── AllocationDrawer.tsx  # Manual allocation side drawer
└── App.tsx
```

## Allocation Algorithm

### Auto-allocation (runs on page load)

1. Sort sub-orders by priority: **Emergency → Overdue → Daily**, then oldest first (FIFO)
2. For each order in priority order:
   - Find the best warehouse: if WH-000, pick warehouse with highest remaining stock
   - Calculate max allocatable qty = min(requestedQty, stockAvailable, creditAvailable / price)
   - Apply **Banker's rounding** (round half to even) to 2 decimal places
   - Deduct from warehouse stock and customer credit
3. Orders that cannot be fulfilled (no stock, no credit) receive allocatedQty = 0

### Manual allocation constraints

- Allocated qty cannot exceed requested qty
- Cannot exceed remaining warehouse stock
- Cannot exceed customer's remaining credit limit
- All violations shown inline in real time before submission

### Pricing

Unit price = basePrice x tierMultiplier

| Order Type | Multiplier |
|---|---|
| EMERGENCY | 125% |
| OVERDUE | 100% |
| DAILY | 90% |

### Special IDs

- WH-000 — allocate from any warehouse (picks highest stock)
- SP-000 — any supplier (uses first matching price rule)