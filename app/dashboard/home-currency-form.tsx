"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
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

export default function HomeCurrencyForm({
  userId,
  current,
}: {
  userId: string;
  current: string | null;
}) {
  const router = useRouter();
  // Empty string = "no preference" (show amounts in each trip's own currency).
  const [value, setValue] = useState(current ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

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

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Your home currency
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Amounts always settle up in each trip&apos;s own currency. If you pick a
        home currency here, every trip also shows an approximate total in it so
        you can gauge the cost in money you know.
      </Typography>
      <Stack spacing={1}>
        {error && <Alert severity="error">{error}</Alert>}
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
      </Stack>
    </Paper>
  );
}
