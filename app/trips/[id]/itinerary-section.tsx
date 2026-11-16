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
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import Alert from "@mui/material/Alert";

export type ItineraryItem = {
  id: string;
  title: string;
  details: string | null;
  day: string | null;
};

export default function ItinerarySection({
  tripId,
  items,
}: {
  tripId: string;
  items: ItineraryItem[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [day, setDay] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("itinerary_items").insert({
      trip_id: tripId,
      title,
      day: day || null,
    });
    setLoading(false);
    if (error) return setError(error.message);
    setTitle("");
    setDay("");
    router.refresh();
  }

  async function remove(id: string) {
    const supabase = createClient();
    await supabase.from("itinerary_items").delete().eq("id", id);
    router.refresh();
  }

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Itinerary
      </Typography>

      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No plans yet. Add the first one below.
        </Typography>
      ) : (
        <List dense>
          {items.map((item) => (
            <ListItem
              key={item.id}
              divider
              secondaryAction={
                <IconButton edge="end" aria-label="delete" onClick={() => remove(item.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemText primary={item.title} secondary={item.day ?? undefined} />
            </ListItem>
          ))}
        </List>
      )}

      <Box component="form" onSubmit={addItem} sx={{ mt: 2 }}>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="What's the plan?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
            size="small"
            placeholder="Visit the fish market"
          />
          <TextField
            label="Day (optional)"
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Button type="submit" variant="contained" disabled={loading} sx={{ alignSelf: "flex-start" }}>
            {loading ? "Adding…" : "Add plan"}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
