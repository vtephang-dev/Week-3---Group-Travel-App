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
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";

export type Idea = {
  id: string;
  title: string;
  notes: string | null;
  decided: boolean;
};

export default function IdeasSection({
  tripId,
  ideas,
}: {
  tripId: string;
  ideas: Idea[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function addIdea(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("ideas").insert({ trip_id: tripId, title });
    setLoading(false);
    if (error) return setError(error.message);
    setTitle("");
    router.refresh();
  }

  async function toggleDecided(id: string, decided: boolean) {
    const supabase = createClient();
    await supabase.from("ideas").update({ decided: !decided }).eq("id", id);
    router.refresh();
  }

  async function remove(id: string) {
    const supabase = createClient();
    await supabase.from("ideas").delete().eq("id", id);
    router.refresh();
  }

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Ideas board
      </Typography>

      {ideas.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No ideas yet. Suggest one for the group below.
        </Typography>
      ) : (
        <Stack spacing={1} sx={{ mb: 2 }}>
          {ideas.map((idea) => (
            <Box key={idea.id}>
              <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
                <Typography sx={{ flexGrow: 1 }}>{idea.title}</Typography>
                {idea.decided && <Chip label="Decided" color="success" size="small" />}
                <Button size="small" onClick={() => toggleDecided(idea.id, idea.decided)}>
                  {idea.decided ? "Undo" : "Decide"}
                </Button>
                <Button size="small" color="error" onClick={() => remove(idea.id)}>
                  Delete
                </Button>
              </Stack>
              <Divider sx={{ mt: 1 }} />
            </Box>
          ))}
        </Stack>
      )}

      <Box component="form" onSubmit={addIdea}>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Suggest an idea"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
            size="small"
            placeholder="Rent bikes for a day"
          />
          <Button type="submit" variant="contained" disabled={loading} sx={{ alignSelf: "flex-start" }}>
            {loading ? "Adding…" : "Add idea"}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
