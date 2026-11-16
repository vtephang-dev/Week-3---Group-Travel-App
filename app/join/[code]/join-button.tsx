"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";

export default function JoinButton({ code }: { code: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data: tripId, error } = await supabase.rpc("join_trip_by_code", { code });
    setLoading(false);
    if (error || !tripId) {
      setError(error?.message ?? "Could not join this trip. Ask the organizer for a new link.");
      return;
    }
    router.push(`/trips/${tripId}`);
    router.refresh();
  }

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <Button variant="contained" size="large" onClick={join} disabled={loading}>
        {loading ? "Joining…" : "Join this trip"}
      </Button>
    </Stack>
  );
}
