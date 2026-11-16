"use client";

import { useState } from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";

export type Member = { user_id: string; name: string };

export default function MembersSection({
  members,
  inviteUrl,
  currentUserId,
}: {
  members: Member[];
  inviteUrl: string;
  currentUserId: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Who&apos;s going ({members.length})
      </Typography>

      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mb: 3 }}>
        {members.map((m) => (
          <Chip
            key={m.user_id}
            label={m.user_id === currentUserId ? `${m.name} (you)` : m.name}
            color={m.user_id === currentUserId ? "primary" : "default"}
          />
        ))}
      </Stack>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Invite people
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Share this link. Anyone who opens it (and logs in) joins this trip.
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
