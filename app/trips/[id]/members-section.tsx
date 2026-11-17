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

export type Member = { user_id: string; name: string };

export type PendingInvite = {
  id: string;
  email: string;
  expires_at: string;
  expired: boolean;
};

export default function MembersSection({
  tripId,
  members,
  inviteUrl,
  currentUserId,
  pendingInvites,
  isOwner,
}: {
  tripId: string;
  members: Member[];
  inviteUrl: string;
  currentUserId: string;
  pendingInvites: PendingInvite[];
  isOwner: boolean;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function removeMember(userId: string, name: string) {
    if (
      !window.confirm(
        `Remove ${name} from this trip? They lose access right away.`
      )
    )
      return;
    const supabase = createClient();
    const { error } = await supabase
      .from("trip_members")
      .delete()
      .eq("trip_id", tripId)
      .eq("user_id", userId);
    if (error) return setError(error.message);
    router.refresh();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    const addr = email.trim().toLowerCase();
    if (!addr) return;
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("invites")
      .insert({ trip_id: tripId, email: addr });
    setBusy(false);
    if (error) {
      if (error.code === "23505") {
        setError("That person has already been invited.");
      } else {
        setError(error.message);
      }
      return;
    }
    setEmail("");
    router.refresh();
  }

  async function cancelInvite(id: string) {
    const supabase = createClient();
    await supabase.from("invites").delete().eq("id", id);
    router.refresh();
  }

  function expiresLabel(iso: string, expired: boolean) {
    if (expired) return "expired";
    // eslint-disable-next-line react-hooks/purity
    const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
    if (days <= 1) return "expires soon";
    return `expires in ${days} days`;
  }

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Who&apos;s going ({members.length})
      </Typography>

      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mb: 2 }}>
        {members.map((m) => (
          <Chip
            key={m.user_id}
            label={m.user_id === currentUserId ? `${m.name} (you)` : m.name}
            color={m.user_id === currentUserId ? "primary" : "default"}
            onDelete={
              isOwner && m.user_id !== currentUserId
                ? () => removeMember(m.user_id, m.name)
                : undefined
            }
          />
        ))}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Alert severity="info" icon={false} sx={{ mb: 3 }}>
        🔒 <strong>Who can see this trip:</strong> only the people added to it. Your
        plans, arrivals, and expense details are visible to trip members only —
        anyone you haven&apos;t invited can&apos;t see anything. Only the organizer can
        remove a member, and a removed person loses access right away.
      </Alert>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Invite someone by email
      </Typography>
      <Box component="form" onSubmit={sendInvite} sx={{ mb: 2 }}>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1}>
            <TextField
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              size="small"
              fullWidth
              placeholder="friend@example.com"
            />
            <Button type="submit" variant="contained" disabled={busy} sx={{ whiteSpace: "nowrap" }}>
              {busy ? "…" : "Invite"}
            </Button>
          </Stack>
        </Stack>
      </Box>

      {pendingInvites.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Waiting to join ({pendingInvites.length})
          </Typography>
          <Stack spacing={1}>
            {pendingInvites.map((inv) => (
              <Stack
                key={inv.id}
                direction="row"
                sx={{ alignItems: "center", gap: 1 }}
              >
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {inv.email}
                </Typography>
                <Chip
                  label={expiresLabel(inv.expires_at, inv.expired)}
                  size="small"
                  color={inv.expired ? "default" : "warning"}
                  variant="outlined"
                />
                <Button size="small" color="error" onClick={() => cancelInvite(inv.id)}>
                  Cancel
                </Button>
              </Stack>
            ))}
          </Stack>
        </Box>
      )}

      <Divider sx={{ mb: 2 }} />

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Or share a join link
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Anyone who opens it (and logs in) joins this trip.
      </Typography>
      <Box sx={{ display: "flex", gap: 1 }}>
        <TextField value={inviteUrl} size="small" fullWidth slotProps={{ input: { readOnly: true } }} />
        <Button variant="contained" onClick={copyLink} sx={{ whiteSpace: "nowrap" }}>
          {copied ? "Copied!" : "Copy"}
        </Button>
      </Box>
    </Paper>
  );
}
