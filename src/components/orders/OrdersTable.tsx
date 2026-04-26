import { useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Box,
  Chip,
  Typography,
  LinearProgress,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import type { SubOrder } from "../../types";

interface Props {
  orders: SubOrder[];
  onSelectOrder: (order: SubOrder) => void;
  loading?: boolean;
}

const TYPE_COLOR: Record<string, "error" | "warning" | "success"> = {
  EMERGENCY: "error",
  OVERDUE: "warning",
  DAILY: "success",
};

const COL_WIDTHS = {
  orderId: 130,
  id: 160,
  itemId: 80,
  warehouseId: 100,
  supplierId: 90,
  type: 110,
  request: 80,
  allocated: 100,
  customerId: 90,
  createDate: 100,
  remark: 130,
};

const ROW_HEIGHT = 48;

export default function OrdersTable({ orders, onSelectOrder, loading }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const virtualizer = useVirtualizer({
    count: orders.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  });

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 300,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          bgcolor: "grey.50",
          borderBottom: "1px solid",
          borderColor: "divider",
          px: 1,
          py: 1,
          position: "sticky",
          top: 0,
          zIndex: 1,
        }}
      >
        {Object.entries(COL_WIDTHS).map(([key, width]) => (
          <Box key={key} sx={{ width, minWidth: width, px: 1 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                textTransform: "uppercase",
                fontSize: "0.7rem",
                fontWeight: 700,
              }}
            >
              {key === "id"
                ? "Sub Order"
                : key === "orderId"
                  ? "Order"
                  : key.replace(/([A-Z])/g, " $1").trim()}
            </Typography>
          </Box>
        ))}
        <Box sx={{ width: 80, minWidth: 80, px: 1 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              textTransform: "uppercase",
              fontSize: "0.7rem",
              fontWeight: 700,
            }}
          >
            Fill %
          </Typography>
        </Box>
      </Box>

      {/* Virtualized rows */}
      <Box ref={parentRef} sx={{ height: 600, overflow: "auto" }}>
        <Box sx={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const order = orders[virtualRow.index];
            const fillPct =
              order.requestQty > 0
                ? (order.allocatedQty / order.requestQty) * 100
                : 0;
            const isHovered = hoveredRow === order.id;

            return (
              <Box
                key={order.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                onClick={() => onSelectOrder(order)}
                onMouseEnter={() => setHoveredRow(order.id)}
                onMouseLeave={() => setHoveredRow(null)}
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                  display: "flex",
                  alignItems: "center",
                  height: ROW_HEIGHT,
                  px: 1,
                  cursor: "pointer",
                  bgcolor: isHovered
                    ? "action.hover"
                    : virtualRow.index % 2 === 0
                      ? "background.paper"
                      : "grey.50",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  transition: "background-color 0.1s",
                }}
              >
                <Cell width={COL_WIDTHS.orderId}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {order.orderId}
                  </Typography>
                </Cell>
                <Cell width={COL_WIDTHS.id}>
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{ color: "primary.main" }}
                  >
                    {order.id}
                  </Typography>
                </Cell>
                <Cell width={COL_WIDTHS.itemId}>
                  <Typography variant="body2" noWrap>
                    {order.itemId}
                  </Typography>
                </Cell>
                <Cell width={COL_WIDTHS.warehouseId}>
                  <Typography
                    variant="body2"
                    noWrap
                    color={
                      order.warehouseId === "WH-000"
                        ? "text.secondary"
                        : "text.primary"
                    }
                  >
                    {order.warehouseId}
                  </Typography>
                </Cell>
                <Cell width={COL_WIDTHS.supplierId}>
                  <Typography
                    variant="body2"
                    noWrap
                    color={
                      order.supplierId === "SP-000"
                        ? "text.secondary"
                        : "text.primary"
                    }
                  >
                    {order.supplierId}
                  </Typography>
                </Cell>
                <Cell width={COL_WIDTHS.type}>
                  <Chip
                    label={order.type}
                    color={TYPE_COLOR[order.type]}
                    size="small"
                    sx={{ fontSize: "0.7rem", height: 22 }}
                  />
                </Cell>
                <Cell width={COL_WIDTHS.request}>
                  <Typography variant="body2">
                    {order.requestQty.toLocaleString()}
                  </Typography>
                </Cell>
                <Cell width={COL_WIDTHS.allocated}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color:
                        fillPct >= 100
                          ? "success.main"
                          : fillPct > 0
                            ? "primary.main"
                            : "text.secondary",
                    }}
                  >
                    {order.allocatedQty.toLocaleString()}
                  </Typography>
                </Cell>
                <Cell width={COL_WIDTHS.customerId}>
                  <Typography variant="body2" noWrap>
                    {order.customerId}
                  </Typography>
                </Cell>
                <Cell width={COL_WIDTHS.createDate}>
                  <Typography variant="body2" noWrap>
                    {order.createDate.toLocaleDateString()}
                  </Typography>
                </Cell>
                <Cell width={COL_WIDTHS.remark}>
                  <Tooltip title={order.remark || ""} placement="left">
                    <Typography variant="body2" noWrap color="text.secondary">
                      {order.remark || "—"}
                    </Typography>
                  </Tooltip>
                </Cell>
                <Cell width={80}>
                  <Box sx={{ width: "100%" }}>
                    <Typography variant="caption" color="text.secondary">
                      {fillPct.toFixed(0)}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(fillPct, 100)}
                      color={
                        fillPct >= 100
                          ? "success"
                          : fillPct > 0
                            ? "primary"
                            : "inherit"
                      }
                      sx={{ height: 4, borderRadius: 1 }}
                    />
                  </Box>
                </Cell>
              </Box>
            );
          })}
        </Box>
      </Box>

      <Box
        sx={{
          px: 2,
          py: 1,
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "grey.50",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Showing {orders.length.toLocaleString()} orders · Click any row to
          manually allocate
        </Typography>
      </Box>
    </Box>
  );
}

function Cell({
  width,
  children,
}: {
  width: number;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ width, minWidth: width, px: 1, overflow: "hidden" }}>
      {children}
    </Box>
  );
}
