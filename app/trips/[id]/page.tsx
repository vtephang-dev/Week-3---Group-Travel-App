import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ItinerarySection from "./itinerary-section";
import IdeasSection from "./ideas-section";
import ArrivalsSection from "./arrivals-section";
import ExpensesSection from "./expenses-section";
import MembersSection from "./members-section";

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trip } = await supabase
    .from("trips")
    .select("id, name, destination, invite_code, owner_id")
    .eq("id", id)
    .single();

  if (!trip) notFound();

  const [{ data: memberRows }, { data: itinerary }, { data: ideas }, { data: arrivals }, { data: expenses }] =
    await Promise.all([
      supabase.from("trip_members").select("user_id").eq("trip_id", id),
      supabase.from("itinerary_items").select("id, title, details, day").eq("trip_id", id).order("day", { ascending: true }),
      supabase.from("ideas").select("id, title, notes, decided").eq("trip_id", id).order("created_at", { ascending: true }),
      supabase.from("arrivals").select("id, arrive_at, location, notes, user_id").eq("trip_id", id).order("arrive_at", { ascending: true }),
      supabase.from("expenses").select("id, description, amount_cents, paid_by").eq("trip_id", id).order("created_at", { ascending: true }),
    ]);

  const memberIds = (memberRows ?? []).map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", memberIds.length > 0 ? memberIds : ["00000000-0000-0000-0000-000000000000"]);

  const nameOf = (uid: string) => {
    const p = (profiles ?? []).find((x) => x.id === uid);
    const dn = p?.display_name ?? (uid === user.id ? user.email : null) ?? "Traveler";
    return dn.includes("@") ? dn.split("@")[0] : dn;
  };

  const members = memberIds.map((uid) => ({ user_id: uid, name: nameOf(uid) }));
  const arrivalRows = (arrivals ?? []).map((a) => ({
    id: a.id,
    arrive_at: a.arrive_at,
    location: a.location,
    notes: a.notes,
    who: nameOf(a.user_id),
  }));
  const expenseRows = (expenses ?? []).map((e) => ({
    id: e.id,
    description: e.description,
    amount_cents: e.amount_cents,
    paid_by: e.paid_by,
    payer_name: nameOf(e.paid_by),
  }));

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = host.includes("localhost") ? "http" : "https";
  const inviteUrl = `${proto}://${host}/join/${trip.invite_code}`;

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 5, display: "flex", flexDirection: "column", gap: 3 }}>
        <Button href="/dashboard" size="small" sx={{ alignSelf: "flex-start" }}>
          ← Back to your trips
        </Button>

        <Box>
          <Typography variant="h4" component="h1" color="primary" sx={{ fontWeight: 700 }}>
            {trip.name}
          </Typography>
          {trip.destination && (
            <Typography variant="h6" color="text.secondary">
              {trip.destination}
            </Typography>
          )}
        </Box>

        <MembersSection members={members} inviteUrl={inviteUrl} currentUserId={user.id} />
        <ItinerarySection tripId={id} items={itinerary ?? []} />
        <IdeasSection tripId={id} ideas={ideas ?? []} />
        <ExpensesSection tripId={id} expenses={expenseRows} members={members} currentUserId={user.id} />
        <ArrivalsSection tripId={id} arrivals={arrivalRows} />
      </Box>
    </Container>
  );
}
