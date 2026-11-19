"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";

const CURRENCIES = [
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "JPY", label: "JPY — Japanese Yen" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
  { code: "AUD", label: "AUD — Australian Dollar" },
  { code: "CHF", label: "CHF — Swiss Franc" },
  { code: "MXN", label: "MXN — Mexican Peso" },
];

export default function NewTripForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (startDate && endDate && endDate < startDate) {
      setError("End date can't be before the start date.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    // Generate the id on the client so we can navigate straight to the new trip
    // without reading it back (which RLS blocks on the just-inserted row).
    const newId =
      typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : undefined;
    const { error } = await supabase.from("trips").insert({
      ...(newId ? { id: newId } : {}),
      name,
      destination: destination || null,
      start_date: startDate || null,
      end_date: endDate || null,
      main_currency: currency,
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }
    // Go straight into the new trip instead of leaving the user on the dashboard.
    if (newId) {
      router.push(`/trips/${newId}`);
    } else {
      router.refresh();
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Plan a new trip
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Trip name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            placeholder="Spring break in Lisbon"
          />
          <TextField
            label="Destination (optional)"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            fullWidth
            placeholder="Lisbon, Portugal"
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Start date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="End date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
          <TextField
            label="Main currency"
            select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            fullWidth
            helperText="The currency the group settles up in."
          >
            {CURRENCIES.map((c) => (
              <MenuItem key={c.code} value={c.code}>
                {c.label}
              </MenuItem>
            ))}
          </TextField>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Adding…" : "Add trip"}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
