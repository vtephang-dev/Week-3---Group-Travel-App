"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { createClient } from "@/utils/supabase/client";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false); // true once a recovery session exists
  const [checked, setChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    // The reset link puts a recovery token in the URL, which the Supabase client
    // exchanges for a temporary session. Listen for it, and also check directly.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      setChecked(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 3,
        }}
      >
        <Typography variant="h4" component="h1" color="primary" sx={{ fontWeight: 700 }}>
          Choose a new password
        </Typography>

        {!checked ? (
          <Typography variant="body2" color="text.secondary">
            Checking your reset link…
          </Typography>
        ) : !ready ? (
          <>
            <Alert severity="error">
              This reset link is invalid or has expired. Reset links work once and only for a
              short time.
            </Alert>
            <Button component={NextLink} href="/forgot-password" variant="contained">
              Request a new link
            </Button>
          </>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="New password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                helperText="At least 6 characters"
              />
              <TextField
                label="Confirm new password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                fullWidth
              />
              <Button type="submit" variant="contained" size="large" disabled={loading}>
                {loading ? "Saving…" : "Set new password"}
              </Button>
            </Stack>
          </Box>
        )}

        <Typography variant="body2" color="text.secondary">
          <Link component={NextLink} href="/login">
            Back to log in
          </Link>
        </Typography>
      </Box>
    </Container>
  );
}
