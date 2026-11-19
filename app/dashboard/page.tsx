import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Alert from "@mui/material/Alert";
import type { Metadata } from "next";
import LogoutButton from "./logout-button";
import NewTripForm from "./new-trip-form";
import HomeCurrencyForm from "./home-currency-form";
import PendingInvites from "./pending-invites";

export const metadata: Metadata = { title: "Your trips" };

type Trip = {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  main_currency: string | null;
  created_at: string;
};

function tripSubtitle(trip: Trip) {
  const parts: string[] = [];
  if (trip.destination) parts.push(trip.destination);
  if (trip.start_date && trip.end_date) {
    parts.push(`${trip.start_date} → ${trip.end_date}`);
  } else if (trip.start_date) {
    parts.push(`from ${trip.start_date}`);
  }
  return parts.length > 0 ? parts.join(" · ") : "No destination set";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The proxy already protects this route, but we double-check here too.
  if (!user) {
    redirect("/login");
  }

  const { data: trips, error: tripsError } = await supabase
    .from("trips")
    .select("id, name, destination, start_date, end_date, main_currency, created_at")
    .order("created_at", { ascending: false });

  // Trips I'm actually a member of (readable trips now also include ones I was
  // only *invited* to, so filter by membership for the "Your trips" list).
  const { data: memberRows } = await supabase
    .from("trip_members")
    .select("trip_id")
    .eq("user_id", user.id);
  const memberTripIds = new Set((memberRows ?? []).map((m) => m.trip_id));

  const tripList = ((trips ?? []) as Trip[]).filter((t) => memberTripIds.has(t.id));

  const { data: profile } = await supabase
    .from("profiles")
    .select("home_currency, display_name")
    .eq("id", user.id)
    .maybeSingle();

  // Trips the person was invited to (matched by email) but hasn't joined yet.
  const { data: inviteRows } = await supabase
    .from("invites")
    .select("id, trip_id, email, expires_at, trips(name, destination)")
    .gt("expires_at", new Date().toISOString());
  const myEmail = (user.email ?? "").toLowerCase();
  const pendingForMe = (inviteRows ?? [])
    .filter((i) => (i.email ?? "").toLowerCase() === myEmail && !memberTripIds.has(i.trip_id))
    .map((i) => {
      const t = i.trips as unknown as { name: string; destination: string | null } | null;
      return {
        id: i.id as string,
        tripName: t?.name ?? "A trip",
        destination: t?.destination ?? null,
      };
    });

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

        {pendingForMe.length > 0 && <PendingInvites invites={pendingForMe} />}

        <NewTripForm />

        <HomeCurrencyForm
          userId={user.id}
          current={profile?.home_currency ?? null}
          displayName={profile?.display_name ?? null}
          email={user.email ?? ""}
        />

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Trips ({tripList.length})
          </Typography>
          {tripsError ? (
            <Alert severity="error">
              We couldn&apos;t load your trips. Please refresh the page to try again.
            </Alert>
          ) : tripList.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No trips yet. Add your first one above!
            </Typography>
          ) : (
            <List>
              {tripList.map((trip) => (
                <ListItem key={trip.id} divider disablePadding>
                  <ListItemButton href={`/trips/${trip.id}`}>
                    <ListItemText
                      primary={trip.name}
                      secondary={tripSubtitle(trip)}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
