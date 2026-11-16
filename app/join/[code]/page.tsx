import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import JoinButton from "./join-button";

function Centered({ children }: { children: React.ReactNode }) {
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
        {children}
      </Box>
    </Container>
  );
}

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  // Look up the trip behind this invite (name + who invited), even for someone
  // who isn't a member yet. Returns nothing for an invalid/unknown code.
  const { data: previewRows } = await supabase.rpc("preview_trip_by_code", { code });
  const preview = Array.isArray(previewRows) ? previewRows[0] : previewRows;

  // Invalid or cancelled invitation.
  if (!preview) {
    return (
      <Centered>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
          This invite isn&apos;t valid
        </Typography>
        <Typography variant="body1" color="text.secondary">
          The link may be mistyped, expired, or cancelled. Ask the person who
          invited you to send you a fresh invite link.
        </Typography>
        <Button href="/dashboard" variant="contained">
          Go to your trips
        </Button>
      </Centered>
    );
  }

  const rawInviter = preview.inviter ?? "the organizer";
  const inviter = rawInviter.includes("@") ? rawInviter.split("@")[0] : rawInviter;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Already signed in?
  if (user) {
    // If already a member, skip straight to the trip (no duplicate join).
    const { data: membership } = await supabase
      .from("trip_members")
      .select("user_id")
      .eq("trip_id", preview.trip_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membership) {
      redirect(`/trips/${preview.trip_id}`);
    }

    // Show a preview and a single confirm step.
    return (
      <Centered>
        <Typography variant="h5" component="h1" color="primary" sx={{ fontWeight: 700 }}>
          You&apos;re invited! 🧳
        </Typography>
        <Typography variant="body1">
          <strong>{inviter}</strong> invited you to join
        </Typography>
        <Typography variant="h6">{preview.trip_name}</Typography>
        <Typography variant="body2" color="text.secondary">
          Joining gives you access to this trip only.
        </Typography>
        <JoinButton code={code} />
        <Button href="/dashboard" size="small">
          Not now
        </Button>
      </Centered>
    );
  }

  // Not signed in: show the preview, then send them to sign up / log in and
  // bring them right back to this invite afterwards.
  const next = encodeURIComponent(`/join/${code}`);
  return (
    <Centered>
      <Typography variant="h5" component="h1" color="primary" sx={{ fontWeight: 700 }}>
        You&apos;re invited! 🧳
      </Typography>
      <Typography variant="body1">
        <strong>{inviter}</strong> invited you to join
      </Typography>
      <Typography variant="h6">{preview.trip_name}</Typography>
      <Typography variant="body2" color="text.secondary">
        Create an account or log in to join — you&apos;ll come straight back here.
      </Typography>
      <Stack direction="row" spacing={2} sx={{ justifyContent: "center" }}>
        <Button href={`/signup?next=${next}`} variant="contained">
          Sign up
        </Button>
        <Button href={`/login?next=${next}`} variant="outlined">
          Log in
        </Button>
      </Stack>
    </Centered>
  );
}
