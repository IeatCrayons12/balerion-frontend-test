import { useState, useEffect } from "react";
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
  Chip,
  LinearProgress,
  Stack,
} from "@mui/material";
import type { SubOrder, Customer, PriceRule } from "../../types";
import { getPrice } from "../../data/mockData";
import { bankersRound } from "../../utils/allocation";

interface Props {
  order: SubOrder | null;
  customer?: Customer;
  priceRules: PriceRule[];
  onClose: () => void;
  onAllocate: (orderId: string, qty: number) => void;
  validate: (
    orderId: string,
    qty: number,
  ) => { valid: boolean; error?: string };
}

const TYPE_COLOR: Record<string, "error" | "warning" | "success"> = {
  EMERGENCY: "error",
  OVERDUE: "warning",
  DAILY: "success",
};

export default function AllocationDrawer({
  order,
  customer,
  priceRules,
  onClose,
  onAllocate,
  validate,
}: Props) {
  const [qty, setQty] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (order) {
      setQty(String(order.allocatedQty));
      setError("");
    }
  }, [order]);

  if (!order) return null;

  const price = getPrice(
    order.itemId,
    order.supplierId,
    order.type,
    priceRules,
  );
  const newQty = parseFloat(qty) || 0;
  const totalCost = bankersRound(newQty * price);
  const allocationPct =
    order.requestQty > 0 ? (newQty / order.requestQty) * 100 : 0;
  const creditPct = customer
    ? (customer.creditUsed / customer.creditLimit) * 100
    : 0;

  const handleSubmit = () => {
    const result = validate(order.id, newQty);
    if (!result.valid) {
      setError(result.error ?? "Invalid allocation");
      return;
    }
    onAllocate(order.id, newQty);
    onClose();
  };

  const handleQtyChange = (v: string) => {
    setQty(v);
    setError("");
    const n = parseFloat(v);
    if (!isNaN(n)) {
      const result = validate(order.id, n);
      if (!result.valid) setError(result.error ?? "");
    }
  };

  return (
    <Drawer anchor="right" open={!!order} onClose={onClose}>
      <Box
        sx={{
          width: 420,
          p: 3,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {order.id}
            </Typography>
            <Chip
              label={order.type}
              color={TYPE_COLOR[order.type]}
              size="small"
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {order.orderId} · {order.itemId} · {order.customerId}
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Order details */}
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          <Row label="Warehouse" value={order.warehouseId} />
          <Row label="Supplier" value={order.supplierId} />
          <Row
            label="Requested Qty"
            value={order.requestQty.toLocaleString()}
          />
          <Row
            label="Current Allocated"
            value={order.allocatedQty.toLocaleString()}
          />
          <Row label="Unit Price" value={`฿${price.toFixed(2)}`} />
          <Row
            label="Create Date"
            value={order.createDate.toLocaleDateString()}
          />
          {order.remark && <Row label="Remark" value={order.remark} />}
        </Stack>

        {/* Customer credit */}
        {customer && (
          <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
            <Typography
              variant="caption"
              sx={{
                mb: 1,
                display: "block",
                color: "text.secondary",
                fontWeight: 600,
              }}
            >
              CUSTOMER CREDIT — {customer.id}
            </Typography>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
            >
              <Typography variant="body2">
                Used: ฿
                {customer.creditUsed.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </Typography>
              <Typography variant="body2">
                Limit: ฿{customer.creditLimit.toLocaleString()}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(creditPct, 100)}
              color={
                creditPct > 90
                  ? "error"
                  : creditPct > 70
                    ? "warning"
                    : "primary"
              }
              sx={{ borderRadius: 1 }}
            />
          </Box>
        )}

        {/* Allocation input */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Allocate Quantity
          </Typography>
          <TextField
            fullWidth
            type="number"
            size="small"
            value={qty}
            onChange={(e) => handleQtyChange(e.target.value)}
            slotProps={{
              htmlInput: { min: 0, max: order.requestQty, step: 1 },
            }}
            error={!!error}
            helperText={error || `Max: ${order.requestQty}`}
          />
          {newQty > 0 && (
            <Box sx={{ mt: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Allocation: {allocationPct.toFixed(1)}%
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Total: ฿
                  {totalCost.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(allocationPct, 100)}
                color={allocationPct >= 100 ? "success" : "primary"}
                sx={{ borderRadius: 1 }}
              />
            </Box>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <Box sx={{ mt: "auto", display: "flex", gap: 1 }}>
          <Button variant="outlined" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            disabled={!!error || qty === ""}
          >
            Confirm Allocation
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {value}
      </Typography>
    </Box>
  );
}
