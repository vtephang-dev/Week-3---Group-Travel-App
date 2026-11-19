"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";

const CURRENCIES = [
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "JPY", label: "JPY — Japanese Yen" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
  { code: "AUD", label: "AUD — Australian Dollar" },
  { code: "CHF", label: "CHF — Swiss Franc" },
  { code: "MXN", label: "MXN — Mexican Peso" },
];

// A person's dashboard profile: their display name (what the group sees) and an
// optional home currency for rough conversions.
export default function HomeCurrencyForm({
  userId,
  current,
  displayName,
  email,
}: {
  userId: string;
  current: string | null;
  displayName: string | null;
  email: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(current ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  // Display name: shows the email by default; let the person set a real name.
  const defaultName =
    displayName && !displayName.includes("@") ? displayName : "";
  const [name, setName] = useState(defaultName);
  const [nameStatus, setNameStatus] = useState<"idle" | "saving" | "saved">("idle");

  async function handleChange(next: string) {
    setValue(next);
    setStatus("saving");
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ home_currency: next || null })
      .eq("id", userId);
    if (error) {
      setStatus("error");
      setError(error.message);
      return;
    }
    setStatus("saved");
    router.refresh();
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setNameStatus("saving");
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: trimmed })
      .eq("id", userId);
    if (error) {
      setError(error.message);
      setNameStatus("idle");
      return;
    }
    setNameStatus("saved");
    router.refresh();
  }

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Your profile
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Your display name is what the group sees on trips. Without one, you show up
        as your email ({email}).
      </Typography>
      <Box component="form" onSubmit={saveName}>
        <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
          <TextField
            label="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="small"
            fullWidth
            placeholder="e.g. Alex"
            helperText={nameStatus === "saved" ? "Saved." : " "}
          />
          <Button type="submit" variant="contained" disabled={nameStatus === "saving" || !name.trim()}>
            {nameStatus === "saving" ? "Saving…" : "Save"}
          </Button>
        </Stack>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
        Home currency
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Amounts always settle up in each trip&apos;s own currency. If you pick a
        home currency here, every trip also shows an approximate total in it.
      </Typography>
      <TextField
        label="Show amounts in"
        select
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        fullWidth
        helperText={
          status === "saving"
            ? "Saving…"
            : status === "saved"
              ? "Saved."
              : "Used only for a rough side-by-side — never changes what anyone owes."
        }
      >
        <MenuItem value="">No preference (use each trip&apos;s currency)</MenuItem>
        {CURRENCIES.map((c) => (
          <MenuItem key={c.code} value={c.code}>
            {c.label}
          </MenuItem>
        ))}
      </TextField>
    </Paper>
  );
}
