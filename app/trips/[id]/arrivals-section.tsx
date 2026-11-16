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
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";

export type Arrival = {
  id: string;
  user_id: string;
  arrive_at: string | null;
  location: string | null;
  flight_number: string | null;
  who: string;
};

export type Member = { user_id: string; name: string };

// We treat the time the traveler types as the destination's LOCAL wall-clock
// time, stored as if it were UTC, so everyone in the group sees the same
// local-to-destination time (no shifting into each viewer's own time zone).

function toInputValue(iso: string | null): string {
  // Stored ISO (…Z) -> "YYYY-MM-DDTHH:MM" for a datetime-local input.
  if (!iso) return "";
  return iso.slice(0, 16);
}

function fromInputValue(value: string): string | null {
  // "YYYY-MM-DDTHH:MM" -> ISO, pinning the wall-clock time to UTC.
  if (!value) return null;
  return new Date(value + ":00Z").toISOString();
}

function showWhen(iso: string | null): string {
  if (!iso) return "Time not set";
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC", // show the wall-clock time exactly as entered
  });
}

export default function ArrivalsSection({
  tripId,
  arrivals,
  currentUserId,
  members,
}: {
  tripId: string;
  arrivals: Arrival[];
  currentUserId: string;
  members: Member[];
}) {
  const router = useRouter();
  const [arriveAt, setArriveAt] = useState("");
  const [location, setLocation] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Inline edit state (for your own arrival)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editArriveAt, setEditArriveAt] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editFlight, setEditFlight] = useState("");

  async function addArrival(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("arrivals").insert({
      trip_id: tripId,
      arrive_at: fromInputValue(arriveAt),
      location: location || null,
      flight_number: flightNumber || null,
    });
    setLoading(false);
    if (error) return setError(error.message);
    setArriveAt("");
    setLocation("");
    setFlightNumber("");
    router.refresh();
  }

  function startEdit(a: Arrival) {
    setEditingId(a.id);
    setEditArriveAt(toInputValue(a.arrive_at));
    setEditLocation(a.location ?? "");
    setEditFlight(a.flight_number ?? "");
    setError(null);
  }

  async function saveEdit(id: string) {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("arrivals")
      .update({
        arrive_at: fromInputValue(editArriveAt),
        location: editLocation || null,
        flight_number: editFlight || null,
      })
      .eq("id", id);
    if (error) return setError(error.message);
    setEditingId(null);
    router.refresh();
  }

  function renderArrival(a: Arrival) {
    return (
      <Box key={a.id}>
        {editingId === a.id ? (
          <Stack spacing={1} sx={{ py: 1 }}>
            <TextField
              label="When do you arrive?"
              type="datetime-local"
              value={editArriveAt}
              onChange={(e) => setEditArriveAt(e.target.value)}
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Where (airport, station…)"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              size="small"
              fullWidth
            />
            <TextField
              label="Flight / train number (optional)"
              value={editFlight}
              onChange={(e) => setEditFlight(e.target.value)}
              size="small"
              fullWidth
            />
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="contained" onClick={() => saveEdit(a.id)}>
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
                {a.who}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {showWhen(a.arrive_at)}
                {a.flight_number ? ` · ${a.flight_number}` : ""}
              </Typography>
            </Box>
            {a.user_id === currentUserId && (
              <Button size="small" onClick={() => startEdit(a)}>
                Edit
              </Button>
            )}
          </Stack>
        )}
        <Divider sx={{ mt: 1 }} />
      </Box>
    );
  }

  // Group arrivals by place so shared rides are easy to spot.
  const groups = new Map<string, Arrival[]>();
  for (const a of arrivals) {
    const key = a.location?.trim() || "Place not set";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(a);
  }

  const arrivedIds = new Set(arrivals.map((a) => a.user_id));
  const notAdded = members.filter((m) => !arrivedIds.has(m.user_id));

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Arrivals
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: "block" }}>
        Times are the destination&apos;s local time.
      </Typography>

      {arrivals.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No arrivals added yet. Add when you get in so others can share rides.
        </Typography>
      ) : (
        <Stack spacing={2} sx={{ mb: 2 }}>
          {[...groups.entries()].map(([place, list]) => (
            <Box key={place}>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 0.5 }}>
                📍 {place}
                {list.length > 1 ? ` · ${list.length} arriving here` : ""}
              </Typography>
              <Stack spacing={1}>{list.map(renderArrival)}</Stack>
            </Box>
          ))}
        </Stack>
      )}

      {notAdded.length > 0 && (
        <Alert severity="info" icon={false} sx={{ mb: 2 }}>
          Still waiting on an arrival from:{" "}
          <strong>
            {notAdded
              .map((m) => (m.user_id === currentUserId ? `${m.name} (you)` : m.name))
              .join(", ")}
          </strong>
        </Alert>
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
          <TextField
            label="Flight / train number (optional)"
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value)}
            size="small"
            fullWidth
            placeholder="JL 42"
          />
          <Button type="submit" variant="contained" disabled={loading} sx={{ alignSelf: "flex-start" }}>
            {loading ? "Adding…" : "Add my arrival"}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
