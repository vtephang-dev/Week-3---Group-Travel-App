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

export type IdeaComment = {
  id: string;
  body: string;
  author_id: string;
  author_name: string;
  created_at: string;
};

export type Idea = {
  id: string;
  title: string;
  notes: string | null;
  decided: boolean;
  created_by: string;
  who: string;
  created_at: string;
  link: string | null;
  cost_cents: number | null;
  comments: IdeaComment[];
};

function whenLabel(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function IdeasSection({
  tripId,
  ideas,
  currentUserId,
  isOwner,
  tripCurrency,
}: {
  tripId: string;
  ideas: Idea[];
  currentUserId: string;
  isOwner: boolean;
  tripCurrency: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [cost, setCost] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  async function saveEdit(id: string) {
    const text = editTitle.trim();
    if (!text) return;
    const supabase = createClient();
    const { error } = await supabase.from("ideas").update({ title: text }).eq("id", id);
    if (error) return setError(error.message);
    setEditingId(null);
    router.refresh();
  }

  async function addIdea(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const costCents = (() => {
      const v = parseFloat(cost);
      return isNaN(v) ? null : Math.round(v * 100);
    })();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("ideas").insert({
      trip_id: tripId,
      title,
      link: link.trim() || null,
      cost_cents: costCents,
    });
    setLoading(false);
    if (error) return setError(error.message);
    setTitle("");
    setLink("");
    setCost("");
    router.refresh();
  }

  async function toggleDecided(id: string, decided: boolean) {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("ideas").update({ decided: !decided }).eq("id", id);
    if (error) return setError(error.message);
    router.refresh();
  }

  async function moveToPlan(idea: Idea) {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("itinerary_items")
      .insert({ trip_id: tripId, title: idea.title });
    if (error) return setError(error.message);
    router.refresh();
  }

  async function remove(id: string) {
    const supabase = createClient();
    await supabase.from("ideas").delete().eq("id", id);
    router.refresh();
  }

  function renderIdea(idea: Idea) {
    const canManage = idea.created_by === currentUserId || isOwner;
    return (
      <Box key={idea.id}>
        {editingId === idea.id ? (
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <TextField
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              size="small"
              fullWidth
            />
            <Button size="small" variant="contained" onClick={() => saveEdit(idea.id)}>
              Save
            </Button>
            <Button size="small" color="inherit" onClick={() => setEditingId(null)}>
              Cancel
            </Button>
          </Stack>
        ) : (
          <Stack direction="row" sx={{ alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Box sx={{ flexGrow: 1, minWidth: 120 }}>
              <Typography>
                {idea.title}
                {idea.cost_cents != null && (
                  <Typography component="span" variant="body2" color="text.secondary">
                    {" "}· ~{tripCurrency} {(idea.cost_cents / 100).toFixed(2)}
                  </Typography>
                )}
              </Typography>
              {idea.link && (
                <Typography variant="caption" sx={{ display: "block" }}>
                  <a href={idea.link} target="_blank" rel="noopener noreferrer">
                    {idea.link}
                  </a>
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                added by {idea.who} · {whenLabel(idea.created_at)}
              </Typography>
            </Box>
            {isOwner && (
              <Button size="small" onClick={() => toggleDecided(idea.id, idea.decided)}>
                {idea.decided ? "Undo decide" : "Decide"}
              </Button>
            )}
            {isOwner && idea.decided && (
              <Button size="small" variant="outlined" onClick={() => moveToPlan(idea)}>
                Move to plan
              </Button>
            )}
            {canManage && (
              <>
                <Button
                  size="small"
                  onClick={() => {
                    setEditingId(idea.id);
                    setEditTitle(idea.title);
                  }}
                >
                  Edit
                </Button>
                <Button size="small" color="error" onClick={() => remove(idea.id)}>
                  Delete
                </Button>
              </>
            )}
          </Stack>
        )}

        <IdeaComments
          tripId={tripId}
          ideaId={idea.id}
          comments={idea.comments}
          currentUserId={currentUserId}
        />

        <Divider sx={{ mt: 1 }} />
      </Box>
    );
  }

  const decidedIdeas = ideas.filter((i) => i.decided);
  const openIdeas = ideas.filter((i) => !i.decided);

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Ideas board
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {ideas.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No ideas yet. Suggest one for the group below.
        </Typography>
      ) : (
        <Box sx={{ mb: 2 }}>
          {decidedIdeas.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 1 }}>
                <Chip label="✓ Decided by the group" color="success" size="small" />
                <Typography variant="caption" color="text.secondary">
                  {decidedIdeas.length}
                </Typography>
              </Stack>
              <Stack spacing={1}>{decidedIdeas.map(renderIdea)}</Stack>
            </Box>
          )}

          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Open ideas
          </Typography>
          {openIdeas.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No open ideas — everything has been decided.
            </Typography>
          ) : (
            <Stack spacing={1}>{openIdeas.map(renderIdea)}</Stack>
          )}
        </Box>
      )}

      <Box component="form" onSubmit={addIdea}>
        <Stack spacing={2}>
          <TextField
            label="Suggest an idea"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
            size="small"
            placeholder="Rent bikes for a day"
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              label="Link (optional)"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              fullWidth
              size="small"
              placeholder="https://…"
            />
            <TextField
              label={`Rough cost (${tripCurrency}, optional)`}
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              size="small"
              placeholder="25.00"
              inputMode="decimal"
              sx={{ minWidth: 160 }}
            />
          </Stack>
          <Button type="submit" variant="contained" disabled={loading} sx={{ alignSelf: "flex-start" }}>
            {loading ? "Adding…" : "Add idea"}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}

function IdeaComments({
  tripId,
  ideaId,
  comments,
  currentUserId,
}: {
  tripId: string;
  ideaId: string;
  comments: IdeaComment[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  const count = comments.length;

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("idea_comments")
      .insert({ idea_id: ideaId, trip_id: tripId, body: text });
    setBusy(false);
    if (error) return setError(error.message);
    setBody("");
    router.refresh();
  }

  async function saveEdit(id: string) {
    const text = editBody.trim();
    if (!text) return;
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("idea_comments")
      .update({ body: text })
      .eq("id", id);
    if (error) return setError(error.message);
    setEditingId(null);
    setEditBody("");
    router.refresh();
  }

  async function removeComment(id: string) {
    const supabase = createClient();
    await supabase.from("idea_comments").delete().eq("id", id);
    router.refresh();
  }

  return (
    <Box sx={{ mt: 0.5, ml: 1 }}>
      <Button
        size="small"
        onClick={() => setOpen((v) => !v)}
        sx={{ textTransform: "none", color: "text.secondary", minWidth: 0, px: 0.5 }}
      >
        💬 {count === 1 ? "1 comment" : `${count} comments`} {open ? "▲" : "▼"}
      </Button>

      {open && (
        <Stack spacing={1} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {comments.map((c) => (
            <Box key={c.id} sx={{ pl: 1, borderLeft: "2px solid", borderColor: "divider" }}>
              <Typography variant="caption" color="text.secondary">
                {c.author_name} · {formatWhen(c.created_at)}
              </Typography>

              {editingId === c.id ? (
                <Stack direction="row" spacing={1} sx={{ mt: 0.5, alignItems: "center" }}>
                  <TextField
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    size="small"
                    fullWidth
                    multiline
                  />
                  <Button size="small" onClick={() => saveEdit(c.id)}>
                    Save
                  </Button>
                  <Button size="small" color="inherit" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </Stack>
              ) : (
                <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" sx={{ flexGrow: 1, whiteSpace: "pre-wrap" }}>
                    {c.body}
                  </Typography>
                  {c.author_id === currentUserId && (
                    <>
                      <Button
                        size="small"
                        sx={{ minWidth: 0 }}
                        onClick={() => {
                          setEditingId(c.id);
                          setEditBody(c.body);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        sx={{ minWidth: 0 }}
                        onClick={() => removeComment(c.id)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </Stack>
              )}
            </Box>
          ))}

          <Box component="form" onSubmit={addComment}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <TextField
                value={body}
                onChange={(e) => setBody(e.target.value)}
                size="small"
                fullWidth
                placeholder="Add a comment…"
              />
              <Button type="submit" size="small" variant="contained" disabled={busy}>
                {busy ? "…" : "Post"}
              </Button>
            </Stack>
          </Box>
        </Stack>
      )}
    </Box>
  );
}
