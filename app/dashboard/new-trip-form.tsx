"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";

export default function NewTripForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("trips")
      .insert({ name, destination: destination || null });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setName("");
    setDestination("");
    router.refresh();
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
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Adding…" : "Add trip"}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
