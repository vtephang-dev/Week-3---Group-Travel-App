import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not logged in: ask them to sign up / log in, then reopen the link.
  if (!user) {
    return (
      <Container maxWidth="xs">
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 3,
            textAlign: "center",
          }}
        >
          <Typography variant="h5" component="h1" color="primary" sx={{ fontWeight: 700 }}>
            You&apos;re invited on a trip! 🧳
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create an account or log in, then open this invite link again to join.
          </Typography>
          <Stack direction="row" spacing={2} sx={{ justifyContent: "center" }}>
            <Button href="/signup" variant="contained">
              Sign up
            </Button>
            <Button href="/login" variant="outlined">
              Log in
            </Button>
          </Stack>
        </Box>
      </Container>
    );
  }

  const { data: tripId } = await supabase.rpc("join_trip_by_code", { code });

  if (!tripId) {
    return (
      <Container maxWidth="xs">
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 3,
            textAlign: "center",
          }}
        >
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
            Invite not found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            That invite link doesn&apos;t match a trip. Ask for a new link.
          </Typography>
          <Button href="/dashboard" variant="contained">
            Go to your trips
          </Button>
        </Box>
      </Container>
    );
  }

  redirect(`/trips/${tripId}`);
}
