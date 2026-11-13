"use client";

import { useState } from "react";
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

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }

    // If email confirmation is off, a session is returned and we can go
    // straight in. If it's on, the user must confirm via email first.
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setMessage("Account created! Check your email to confirm, then log in.");
    }
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
          Create your account
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            {message && <Alert severity="success">{message}</Alert>}
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              helperText="At least 6 characters"
            />
            <Button type="submit" variant="contained" size="large" disabled={loading}>
              {loading ? "Creating…" : "Sign up"}
            </Button>
          </Stack>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Already have an account?{" "}
          <Link component={NextLink} href="/login">
            Log in
          </Link>
        </Typography>
      </Box>
    </Container>
  );
}
