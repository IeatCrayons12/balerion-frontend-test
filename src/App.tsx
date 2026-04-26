import { useState } from "react";
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  CssBaseline,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import SetMealIcon from "@mui/icons-material/SetMeal";
import type { SubOrder } from "./types/index";
import { useAllocationStore } from "./hooks/useAllocationStore";
import StatsBar from "./components/layout/StatsBar";
import FilterBar from "./components/orders/FilterBar";
import OrdersTable from "./components/orders/OrdersTable";
import AllocationDrawer from "./components/allocation/AllocationDrawer";

const theme = createTheme({
  palette: {
    background: { default: "#f5f7fa" },
  },
  shape: { borderRadius: 8 },
  typography: { fontFamily: '"Inter", "Helvetica", sans-serif' },
});

export default function App() {
  const store = useAllocationStore();
  const [selectedOrder, setSelectedOrder] = useState<SubOrder | null>(null);

  const selectedCustomer = selectedOrder
    ? store.customers.get(selectedOrder.customerId)
    : undefined;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: "white",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar>
          <SetMealIcon sx={{ color: "primary.main", mr: 1 }} />
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: "text.primary" }}
          >
            Salmon Allocation System
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            Balerion · Interview 12.1
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ bgcolor: "background.default", minHeight: "100vh", py: 3 }}>
        <Container maxWidth="xl">
          <StatsBar stats={store.stats} totalStock={store.totalStock} />

          <FilterBar
            search={store.search}
            setSearch={store.setSearch}
            filterType={store.filterType}
            setFilterType={store.setFilterType}
            totalResults={store.filteredOrders.length}
          />

          <OrdersTable
            orders={store.filteredOrders}
            onSelectOrder={setSelectedOrder}
            loading={!store.initialized}
          />
        </Container>
      </Box>

      <AllocationDrawer
        order={selectedOrder}
        customer={selectedCustomer}
        priceRules={store.priceRules}
        onClose={() => setSelectedOrder(null)}
        onAllocate={store.manualAllocate}
        validate={store.validate}
      />
    </ThemeProvider>
  );
}
