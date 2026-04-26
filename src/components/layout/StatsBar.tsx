import { Box, Paper, Typography } from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AssignmentIcon from "@mui/icons-material/Assignment";

interface Props {
  stats: {
    total: number;
    allocated: number;
    fullyAllocated: number;
    emergency: number;
  };
  totalStock: number;
}

const cards = [
  {
    label: "Total Sub Orders",
    key: "total",
    icon: AssignmentIcon,
    color: "#1976d2",
  },
  {
    label: "Allocated",
    key: "allocated",
    icon: CheckCircleIcon,
    color: "#2e7d32",
  },
  {
    label: "Fully Allocated",
    key: "fullyAllocated",
    icon: InventoryIcon,
    color: "#7b1fa2",
  },
  {
    label: "Emergency",
    key: "emergency",
    icon: WarningAmberIcon,
    color: "#d32f2f",
  },
];

export default function StatsBar({ stats, totalStock }: Props) {
  return (
    <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
      {cards.map(({ label, key, icon: Icon, color }) => (
        <Paper
          key={key}
          elevation={0}
          sx={{
            flex: "1 1 160px",
            p: 2,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: `${color}15` }}>
            <Icon sx={{ color, fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {stats[key as keyof typeof stats].toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
          </Box>
        </Paper>
      ))}

      <Paper
        elevation={0}
        sx={{
          flex: "1 1 160px",
          p: 2,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: "#e65100" + "15" }}>
          <InventoryIcon sx={{ color: "#e65100", fontSize: 22 }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {totalStock.toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Remaining Stock
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
