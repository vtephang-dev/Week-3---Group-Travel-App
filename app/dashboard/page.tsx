import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import LogoutButton from "./logout-button";
import NewTripForm from "./new-trip-form";

type Trip = {
  id: string;
  name: string;
  destination: string | null;
  created_at: string;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The proxy already protects this route, but we double-check here too.
  if (!user) {
    redirect("/login");
  }

  const { data: trips } = await supabase
    .from("trips")
    .select("id, name, destination, created_at")
    .order("created_at", { ascending: false });

  const tripList = (trips ?? []) as Trip[];

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6, display: "flex", flexDirection: "column", gap: 3 }}>
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <Typography variant="h4" component="h1" color="primary" sx={{ fontWeight: 700 }}>
            Your trips
          </Typography>
          <LogoutButton />
        </Stack>

        <Typography variant="body2" color="text.secondary">
          Signed in as {user.email}
        </Typography>

        <NewTripForm />

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Trips ({tripList.length})
          </Typography>
          {tripList.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No trips yet. Add your first one above!
            </Typography>
          ) : (
            <List>
              {tripList.map((trip) => (
                <ListItem key={trip.id} divider>
                  <ListItemText
                    primary={trip.name}
                    secondary={trip.destination ?? "No destination set"}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
