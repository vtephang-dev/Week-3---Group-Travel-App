import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import LogoutButton from "./logout-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The proxy already protects this route, but we double-check here too.
  if (!user) {
    redirect("/login");
  }

  return (
    <Container maxWidth="sm">
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
          Welcome! 🎉
        </Typography>
        <Typography variant="body1" color="text.secondary">
          You are logged in as <strong>{user.email}</strong>.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This is your dashboard. Your trips will show up here soon.
        </Typography>
        <Stack direction="row">
          <LogoutButton />
        </Stack>
      </Box>
    </Container>
  );
}
