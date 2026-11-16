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
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";

export type ItineraryItem = {
  id: string;
  title: string;
  details: string | null;
  day: string | null;
  start_time: string | null; // "HH:MM:SS" or "HH:MM"
  place: string | null;
  cost_cents: number | null;
  currency: string | null;
  version: number;
  created_by: string;
  who: string;
  opted_in_names: string[];
  i_am_in: boolean;
};

function formatDay(day: string | null) {
  if (!day) return "No day set";
  return new Date(day + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(t: string | null) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatCost(cents: number | null, currency: string | null) {
  if (cents == null) return "";
  const amount = (cents / 100).toFixed(2);
  return `${currency ?? "USD"} ${amount}`;
}

export default function ItinerarySection({
  tripId,
  items,
  currentUserId,
  isOwner,
  tripCurrency,
}: {
  tripId: string;
  items: ItineraryItem[];
  currentUserId: string;
  isOwner: boolean;
  tripCurrency: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [day, setDay] = useState("");
  const [startTime, setStartTime] = useState("");
  const [place, setPlace] = useState("");
  const [cost, setCost] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState({
    title: "",
    day: "",
    startTime: "",
    place: "",
    cost: "",
    version: 0,
  });

  function costToCents(value: string): number | null {
    if (!value.trim()) return null;
    const n = Number(value);
    if (Number.isNaN(n)) return null;
    return Math.round(n * 100);
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("itinerary_items").insert({
      trip_id: tripId,
      title,
      day: day || null,
      start_time: startTime || null,
      place: place || null,
      cost_cents: costToCents(cost),
      currency: cost.trim() ? tripCurrency : null,
    });
    setLoading(false);
    if (error) return setError(error.message);
    setTitle("");
    setDay("");
    setStartTime("");
    setPlace("");
    setCost("");
    router.refresh();
  }

  function startEdit(item: ItineraryItem) {
    setEditingId(item.id);
    setError(null);
    setEdit({
      title: item.title,
      day: item.day ?? "",
      startTime: item.start_time ? item.start_time.slice(0, 5) : "",
      place: item.place ?? "",
      cost: item.cost_cents != null ? (item.cost_cents / 100).toString() : "",
      version: item.version,
    });
  }

  async function saveEdit(id: string) {
    setError(null);
    const supabase = createClient();
    // Optimistic concurrency: only update if the version still matches what we
    // loaded. If someone else edited first, 0 rows come back -> we warn & reload.
    const { data, error } = await supabase
      .from("itinerary_items")
      .update({
        title: edit.title,
        day: edit.day || null,
        start_time: edit.startTime || null,
        place: edit.place || null,
        cost_cents: costToCents(edit.cost),
        currency: edit.cost.trim() ? tripCurrency : null,
        version: edit.version + 1,
      })
      .eq("id", id)
      .eq("version", edit.version)
      .select("id");

    if (error) return setError(error.message);
    if (!data || data.length === 0) {
      setError("Someone else changed this plan item. Reloading the latest version…");
      setEditingId(null);
      router.refresh();
      return;
    }
    setEditingId(null);
    router.refresh();
  }

  async function remove(id: string) {
    const supabase = createClient();
    await supabase.from("itinerary_items").delete().eq("id", id);
    router.refresh();
  }

  async function toggleOptin(itemId: string, iAmIn: boolean) {
    const supabase = createClient();
    if (iAmIn) {
      await supabase
        .from("item_optins")
        .delete()
        .eq("item_id", itemId)
        .eq("user_id", currentUserId);
    } else {
      await supabase.from("item_optins").insert({ item_id: itemId, trip_id: tripId });
    }
    router.refresh();
  }

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Itinerary
      </Typography>

      {error && (
        <Alert severity={error.startsWith("Someone else") ? "warning" : "error"} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No plans yet. Add the first one below.
        </Typography>
      ) : (
        <Stack spacing={1} sx={{ mb: 2 }}>
          {items.map((item) => {
            const canDelete = item.created_by === currentUserId || isOwner;
            return (
              <Box key={item.id}>
                {editingId === item.id ? (
                  <Stack spacing={1} sx={{ py: 1 }}>
                    <TextField
                      label="What's the plan?"
                      value={edit.title}
                      onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                      size="small"
                      fullWidth
                      required
                    />
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <TextField
                        label="Day"
                        type="date"
                        value={edit.day}
                        onChange={(e) => setEdit({ ...edit, day: e.target.value })}
                        size="small"
                        fullWidth
                        slotProps={{ inputLabel: { shrink: true } }}
                      />
                      <TextField
                        label="Time"
                        type="time"
                        value={edit.startTime}
                        onChange={(e) => setEdit({ ...edit, startTime: e.target.value })}
                        size="small"
                        fullWidth
                        slotProps={{ inputLabel: { shrink: true } }}
                      />
                    </Stack>
                    <TextField
                      label="Place"
                      value={edit.place}
                      onChange={(e) => setEdit({ ...edit, place: e.target.value })}
                      size="small"
                      fullWidth
                    />
                    <TextField
                      label={`Cost (${tripCurrency}, optional)`}
                      value={edit.cost}
                      onChange={(e) => setEdit({ ...edit, cost: e.target.value })}
                      size="small"
                      fullWidth
                      placeholder="25.00"
                    />
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="contained" onClick={() => saveEdit(item.id)}>
                        Save
                      </Button>
                      <Button size="small" color="inherit" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <Stack direction="row" sx={{ alignItems: "flex-start", gap: 1 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.title}
                        {item.place ? ` @ ${item.place}` : ""}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDay(item.day)}
                        {item.start_time ? ` · ${formatTime(item.start_time)}` : ""}
                        {item.cost_cents != null ? ` · ${formatCost(item.cost_cents, item.currency)}` : ""}
                        {` · added by ${item.who}`}
                      </Typography>
                      <Stack direction="row" sx={{ alignItems: "center", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
                        <Button
                          size="small"
                          variant={item.i_am_in ? "outlined" : "contained"}
                          onClick={() => toggleOptin(item.id, item.i_am_in)}
                          sx={{ py: 0, minWidth: 0 }}
                        >
                          {item.i_am_in ? "Leave" : "I'm in"}
                        </Button>
                        <Typography variant="caption" color="text.secondary">
                          {item.opted_in_names.length > 0
                            ? `In: ${item.opted_in_names.join(", ")}`
                            : "No one's in yet"}
                        </Typography>
                      </Stack>
                    </Box>
                    <Button size="small" onClick={() => startEdit(item)}>
                      Edit
                    </Button>
                    {canDelete && (
                      <Button size="small" color="error" onClick={() => remove(item.id)}>
                        Delete
                      </Button>
                    )}
                  </Stack>
                )}
                <Divider sx={{ mt: 1 }} />
              </Box>
            );
          })}
        </Stack>
      )}

      <Box component="form" onSubmit={addItem} sx={{ mt: 2 }}>
        <Stack spacing={2}>
          <TextField
            label="What's the plan?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
            size="small"
            placeholder="Visit the fish market"
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Day"
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
          <TextField
            label="Place (optional)"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            size="small"
            fullWidth
            placeholder="Tsukiji Market"
          />
          <TextField
            label={`Cost (${tripCurrency}, optional)`}
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            size="small"
            fullWidth
            placeholder="25.00"
          />
          <Button type="submit" variant="contained" disabled={loading} sx={{ alignSelf: "flex-start" }}>
            {loading ? "Adding…" : "Add plan"}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
