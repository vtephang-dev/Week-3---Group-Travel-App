"use client";

import { useState } from "react";
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
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
          Reset your password
        </Typography>

        {sent ? (
          <>
            <Alert severity="success">
              If an account exists for <strong>{email}</strong>, we&apos;ve sent a password-reset
              link to that email. Open it to choose a new password. The link works once and
              expires after a while.
            </Alert>
            <Typography variant="body2" color="text.secondary">
              <Link component={NextLink} href="/login">
                Back to log in
              </Link>
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary">
              Enter your email and we&apos;ll send a link to set a new password.
            </Typography>
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                {error && <Alert severity="error">{error}</Alert>}
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  fullWidth
                />
                <Button type="submit" variant="contained" size="large" disabled={loading}>
                  {loading ? "Sending…" : "Send reset link"}
                </Button>
              </Stack>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Remembered it?{" "}
              <Link component={NextLink} href="/login">
                Back to log in
              </Link>
            </Typography>
          </>
        )}
      </Box>
    </Container>
  );
}
