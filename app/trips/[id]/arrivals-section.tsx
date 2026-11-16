"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Alert from "@mui/material/Alert";

export type Arrival = {
  id: string;
  arrive_at: string | null;
  location: string | null;
  notes: string | null;
  who: string;
};

export default function ArrivalsSection({
  tripId,
  arrivals,
}: {
  tripId: string;
  arrivals: Arrival[];
}) {
  const router = useRouter();
  const [arriveAt, setArriveAt] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function addArrival(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("arrivals").insert({
      trip_id: tripId,
      arrive_at: arriveAt ? new Date(arriveAt).toISOString() : null,
      location: location || null,
    });
    setLoading(false);
    if (error) return setError(error.message);
    setArriveAt("");
    setLocation("");
    router.refresh();
  }

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Arrivals
      </Typography>

      {arrivals.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No arrivals added yet. Add when you get in so others can share rides.
        </Typography>
      ) : (
        <List dense>
          {arrivals.map((a) => (
            <ListItem key={a.id} divider>
              <ListItemText
                primary={`${a.who}${a.location ? " — " + a.location : ""}`}
                secondary={a.arrive_at ? new Date(a.arrive_at).toLocaleString() : "Time not set"}
              />
            </ListItem>
          ))}
        </List>
      )}

      <Box component="form" onSubmit={addArrival} sx={{ mt: 2 }}>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="When do you arrive?"
            type="datetime-local"
            value={arriveAt}
            onChange={(e) => setArriveAt(e.target.value)}
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Where (airport, station…)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            size="small"
            fullWidth
            placeholder="Narita Airport"
          />
          <Button type="submit" variant="contained" disabled={loading} sx={{ alignSelf: "flex-start" }}>
            {loading ? "Adding…" : "Add my arrival"}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
