import {
  Box,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import type { FilterType } from "../../types";

interface Props {
  search: string;
  setSearch: (v: string) => void;
  filterType: FilterType;
  setFilterType: (v: FilterType) => void;
  totalResults: number;
}

export default function FilterBar({
  search,
  setSearch,
  filterType,
  setFilterType,
  totalResults,
}: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        mb: 2,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <TextField
        size="small"
        placeholder={`Search ${totalResults.toLocaleString()} orders...`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ minWidth: 280 }}
      />
      <ToggleButtonGroup
        value={filterType}
        exclusive
        size="small"
        onChange={(_, v) => v && setFilterType(v)}
      >
        <ToggleButton value="ALL">All</ToggleButton>
        <ToggleButton value="EMERGENCY" sx={{ color: "error.main" }}>
          Emergency
        </ToggleButton>
        <ToggleButton value="OVERDUE" sx={{ color: "warning.main" }}>
          Overdue
        </ToggleButton>
        <ToggleButton value="DAILY" sx={{ color: "success.main" }}>
          Daily
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
