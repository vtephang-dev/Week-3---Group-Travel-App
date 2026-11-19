"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";

export type Invite = {
  id: string;
  tripName: string;
  destination: string | null;
};

// Trips this person was invited to but hasn't joined. Accepting joins them and
// takes them straight into the trip.
export default function PendingInvites({ invites }: { invites: Invite[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function accept(id: string) {
    setError(null);
    setBusyId(id);
    const supabase = createClient();
    const { data: tripId, error } = await supabase.rpc("accept_invite", {
      p_invite_id: id,
    });
    if (error) {
      setBusyId(null);
      setError(error.message);
      return;
    }
    if (typeof tripId === "string") {
      router.push(`/trips/${tripId}`);
    } else {
      router.refresh();
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 3, borderColor: "primary.light" }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        You&apos;re invited {invites.length > 1 ? `(${invites.length})` : ""}
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Stack spacing={1}>
        {invites.map((inv) => (
          <Stack
            key={inv.id}
            direction="row"
            sx={{ alignItems: "center", gap: 1, flexWrap: "wrap" }}
          >
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              <strong>{inv.tripName}</strong>
              {inv.destination ? ` · ${inv.destination}` : ""}
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={() => accept(inv.id)}
              disabled={busyId === inv.id}
            >
              {busyId === inv.id ? "Joining…" : "Accept"}
            </Button>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}
