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

function formatDateRange(start: string | null, end: string | null) {
  const fmt = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return `From ${fmt(start)}`;
  if (end) return `Until ${fmt(end)}`;
  return "Dates not set";
}

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
    .select("id, name, destination, invite_code, owner_id, start_date, end_date, main_currency")
    .eq("id", id)
    .single();

  if (!trip) notFound();

  const [{ data: memberRows }, { data: itinerary }, { data: ideas }, { data: ideaComments }, { data: arrivals }, { data: expenses }, { data: splits }] =
    await Promise.all([
      supabase.from("trip_members").select("user_id").eq("trip_id", id),
      supabase.from("itinerary_items").select("id, title, details, day").eq("trip_id", id).order("day", { ascending: true }),
      supabase.from("ideas").select("id, title, notes, decided").eq("trip_id", id).order("created_at", { ascending: true }),
      supabase.from("idea_comments").select("id, idea_id, body, author_id, created_at").eq("trip_id", id).order("created_at", { ascending: true }),
      supabase.from("arrivals").select("id, arrive_at, location, notes, user_id, flight_number").eq("trip_id", id).order("arrive_at", { ascending: true }),
      supabase.from("expenses").select("id, description, amount_cents, paid_by").eq("trip_id", id).order("created_at", { ascending: true }),
      supabase.from("expense_splits").select("expense_id, user_id, share_cents").eq("trip_id", id),
    ]);

  const { data: invites } = await supabase
    .from("invites")
    .select("id, email, expires_at")
    .eq("trip_id", id)
    .order("created_at", { ascending: true });

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

  // Emails of people already in the trip (profiles store the email as display_name).
  const memberEmails = new Set<string>();
  for (const p of profiles ?? []) {
    if (p.display_name && p.display_name.includes("@")) {
      memberEmails.add(p.display_name.toLowerCase());
    }
  }
  if (user.email) memberEmails.add(user.email.toLowerCase());

  // "Who hasn't joined yet" = invited emails that aren't members yet.
  const now = Date.now();
  const pendingInvites = (invites ?? [])
    .filter((inv) => !memberEmails.has(inv.email.toLowerCase()))
    .map((inv) => ({
      id: inv.id,
      email: inv.email,
      expires_at: inv.expires_at,
      expired: new Date(inv.expires_at).getTime() < now,
    }));

  const ideasWithComments = (ideas ?? []).map((idea) => ({
    ...idea,
    comments: (ideaComments ?? [])
      .filter((c) => c.idea_id === idea.id)
      .map((c) => ({
        id: c.id,
        body: c.body,
        author_id: c.author_id,
        author_name: nameOf(c.author_id),
        created_at: c.created_at,
      })),
  }));
  const arrivalRows = (arrivals ?? []).map((a) => ({
    id: a.id,
    user_id: a.user_id,
    arrive_at: a.arrive_at,
    location: a.location,
    flight_number: a.flight_number,
    who: nameOf(a.user_id),
  }));
  const allSplits = splits ?? [];
  const expenseRows = (expenses ?? []).map((e) => ({
    id: e.id,
    description: e.description,
    amount_cents: e.amount_cents,
    payer_name: nameOf(e.paid_by),
    shared_with: allSplits
      .filter((s) => s.expense_id === e.id)
      .map((s) => nameOf(s.user_id)),
  }));

  // Balances: what each member paid minus what they owe (their shares).
  const paid: Record<string, number> = {};
  for (const e of expenses ?? []) paid[e.paid_by] = (paid[e.paid_by] ?? 0) + e.amount_cents;
  const owed: Record<string, number> = {};
  for (const s of allSplits) owed[s.user_id] = (owed[s.user_id] ?? 0) + s.share_cents;

  const balances = members.map((m) => ({
    user_id: m.user_id,
    name: m.name,
    net_cents: (paid[m.user_id] ?? 0) - (owed[m.user_id] ?? 0),
  }));

  // Settle up: greedily match the biggest debtor with the biggest creditor.
  const creditors = balances
    .filter((b) => b.net_cents > 0)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.net_cents - a.net_cents);
  const debtors = balances
    .filter((b) => b.net_cents < 0)
    .map((b) => ({ ...b, net_cents: -b.net_cents }))
    .sort((a, b) => b.net_cents - a.net_cents);

  const settlements: { from: string; to: string; amount_cents: number }[] = [];
  let ci = 0;
  let di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const pay = Math.min(creditors[ci].net_cents, debtors[di].net_cents);
    if (pay > 0) {
      settlements.push({ from: debtors[di].name, to: creditors[ci].name, amount_cents: pay });
    }
    creditors[ci].net_cents -= pay;
    debtors[di].net_cents -= pay;
    if (creditors[ci].net_cents === 0) ci++;
    if (debtors[di].net_cents === 0) di++;
  }

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
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {formatDateRange(trip.start_date, trip.end_date)} · Settles up in{" "}
            {trip.main_currency ?? "USD"}
          </Typography>
        </Box>

        <MembersSection
          tripId={id}
          members={members}
          inviteUrl={inviteUrl}
          currentUserId={user.id}
          pendingInvites={pendingInvites}
        />
        <ItinerarySection tripId={id} items={itinerary ?? []} />
        <IdeasSection tripId={id} ideas={ideasWithComments} currentUserId={user.id} />
        <ExpensesSection
          tripId={id}
          expenses={expenseRows}
          members={members}
          currentUserId={user.id}
          balances={balances}
          settlements={settlements}
        />
        <ArrivalsSection tripId={id} arrivals={arrivalRows} currentUserId={user.id} />
      </Box>
    </Container>
  );
}
