import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import ItinerarySection from "./itinerary-section";
import IdeasSection from "./ideas-section";
import ArrivalsSection from "./arrivals-section";
import ExpensesSection from "./expenses-section";
import MembersSection from "./members-section";
import HomeCurrencyStrip from "./home-currency-strip";
import TripTabs from "./trip-tabs";
import DeleteTripButton from "./delete-trip-button";
import { getRate, type FxRate } from "@/utils/fx";

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

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("home_currency")
    .eq("id", user.id)
    .maybeSingle();
  const homeCurrency = myProfile?.home_currency ?? null;

  const [{ data: memberRows }, { data: itinerary }, { data: ideas }, { data: ideaComments }, { data: arrivals }, { data: expenses }, { data: splits }] =
    await Promise.all([
      supabase.from("trip_members").select("user_id").eq("trip_id", id),
      supabase.from("itinerary_items").select("id, title, details, day, start_time, place, cost_cents, currency, version, created_by").eq("trip_id", id).order("day", { ascending: true, nullsFirst: false }).order("start_time", { ascending: true, nullsFirst: true }),
      supabase.from("ideas").select("id, title, notes, decided, created_by, created_at, link, cost_cents").eq("trip_id", id).order("created_at", { ascending: true }),
      supabase.from("idea_comments").select("id, idea_id, body, author_id, created_at").eq("trip_id", id).order("created_at", { ascending: true }),
      supabase.from("arrivals").select("id, arrive_at, location, notes, user_id, flight_number").eq("trip_id", id).order("arrive_at", { ascending: true }),
      supabase.from("expenses").select("id, description, amount_cents, paid_by, currency, created_at, deleted_at, split_mode, entered_amount_cents, entered_currency, fx_rate_to_trip, fx_rate_date").eq("trip_id", id).order("created_at", { ascending: true }),
      supabase.from("expense_splits").select("expense_id, user_id, share_cents").eq("trip_id", id),
    ]);

  const { data: invites } = await supabase
    .from("invites")
    .select("id, email, expires_at")
    .eq("trip_id", id)
    .order("created_at", { ascending: true });

  const { data: payments } = await supabase
    .from("settlements")
    .select("from_user, to_user, amount_cents, paid_at")
    .eq("trip_id", id)
    .order("paid_at", { ascending: true });

  const { data: itemOptins } = await supabase
    .from("item_optins")
    .select("item_id, user_id")
    .eq("trip_id", id);

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
  // (This is a Server Component rendered once per request, so reading the clock
  // here is intentional and deterministic for the request.)
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const pendingInvites = (invites ?? [])
    .filter((inv) => !memberEmails.has(inv.email.toLowerCase()))
    .map((inv) => ({
      id: inv.id,
      email: inv.email,
      expires_at: inv.expires_at,
      expired: new Date(inv.expires_at).getTime() < now,
    }));

  const itineraryRows = (itinerary ?? []).map((it) => {
    const optins = (itemOptins ?? []).filter((o) => o.item_id === it.id);
    return {
      id: it.id,
      title: it.title,
      details: it.details,
      day: it.day,
      start_time: it.start_time,
      place: it.place,
      cost_cents: it.cost_cents,
      currency: it.currency,
      version: it.version ?? 0,
      created_by: it.created_by,
      who: nameOf(it.created_by),
      opted_in_names: optins.map((o) => nameOf(o.user_id)),
      i_am_in: optins.some((o) => o.user_id === user.id),
    };
  });

  const ideasWithComments = (ideas ?? []).map((idea) => ({
    ...idea,
    who: nameOf(idea.created_by),
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
  const activeExpenses = (expenses ?? []).filter((e) => !e.deleted_at);
  const expenseRows = activeExpenses.map((e) => {
    const mySplits = allSplits.filter((s) => s.expense_id === e.id);
    return {
      id: e.id,
      description: e.description,
      amount_cents: e.amount_cents,
      currency: e.currency ?? "USD",
      created_at: e.created_at,
      split_mode: e.split_mode ?? "even",
      payer_name: nameOf(e.paid_by),
      shared_with: mySplits.map((s) => nameOf(s.user_id)),
      breakdown: mySplits.map((s) => ({ name: nameOf(s.user_id), share_cents: s.share_cents })),
      entered_amount_cents: e.entered_amount_cents ?? null,
      entered_currency: e.entered_currency ?? null,
      fx_rate_to_trip: e.fx_rate_to_trip ?? null,
      fx_rate_date: e.fx_rate_date ?? null,
    };
  });

  const removedExpenses = (expenses ?? [])
    .filter((e) => e.deleted_at)
    .map((e) => ({
      id: e.id,
      description: e.description,
      amount_cents: e.amount_cents,
      currency: e.currency ?? "USD",
      payer_name: nameOf(e.paid_by),
      removed_at: e.deleted_at as string,
    }));

  // Balances: what each member paid minus what they owe (their shares).
  // Soft-deleted costs are excluded so removing one updates balances correctly.
  const activeExpenseIds = new Set(activeExpenses.map((e) => e.id));
  const paid: Record<string, number> = {};
  for (const e of activeExpenses) paid[e.paid_by] = (paid[e.paid_by] ?? 0) + e.amount_cents;
  const owed: Record<string, number> = {};
  for (const s of allSplits) {
    if (!activeExpenseIds.has(s.expense_id)) continue; // skip removed costs
    owed[s.user_id] = (owed[s.user_id] ?? 0) + s.share_cents;
  }

  // Recorded payments: when A pays B, A's net goes up and B's net goes down.
  const settledNet: Record<string, number> = {};
  for (const p of payments ?? []) {
    settledNet[p.from_user] = (settledNet[p.from_user] ?? 0) + p.amount_cents;
    settledNet[p.to_user] = (settledNet[p.to_user] ?? 0) - p.amount_cents;
  }

  const balances = members.map((m) => ({
    user_id: m.user_id,
    name: m.name,
    net_cents:
      (paid[m.user_id] ?? 0) - (owed[m.user_id] ?? 0) + (settledNet[m.user_id] ?? 0),
  }));

  const hasMoneyActivity = activeExpenses.length > 0 || (payments ?? []).length > 0;
  const allSettled = hasMoneyActivity && balances.every((b) => b.net_cents === 0);

  const recordedPayments = (payments ?? []).map((p) => ({
    from_name: nameOf(p.from_user),
    to_name: nameOf(p.to_user),
    amount_cents: p.amount_cents,
  }));

  // "Trip at a glance" summary numbers.
  const tripCurrency = trip.main_currency ?? "USD";
  const planCount = (itinerary ?? []).length;
  const summaryTotalCents = activeExpenses.reduce((s, e) => s + e.amount_cents, 0);
  const myBalance = balances.find((b) => b.user_id === user.id) ?? null;
  const fmtMoney = (cents: number) => `${tripCurrency} ${(cents / 100).toFixed(2)}`;
  const myBalanceLabel =
    myBalance == null || myBalance.net_cents === 0
      ? null
      : myBalance.net_cents > 0
        ? `you're owed ${fmtMoney(myBalance.net_cents)}`
        : `you owe ${fmtMoney(-myBalance.net_cents)}`;

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

  // Rate for the viewer's home currency (fetched server-side to avoid browser
  // CORS limits; cached daily in fx_rates). null when not applicable or failed.
  const homeFx: FxRate | null =
    homeCurrency && homeCurrency !== tripCurrency
      ? await getRate(supabase, tripCurrency, homeCurrency)
      : null;

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

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="overline" color="text.secondary">
            Trip at a glance
          </Typography>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mt: 0.5 }}>
            <Chip size="small" label={`👥 ${members.length} ${members.length === 1 ? "person" : "people"}`} />
            {planCount > 0 && (
              <Chip size="small" label={`📋 ${planCount} ${planCount === 1 ? "plan" : "plans"}`} />
            )}
            {summaryTotalCents > 0 && (
              <Chip size="small" label={`💰 ${fmtMoney(summaryTotalCents)} total`} />
            )}
            {myBalanceLabel && (
              <Chip
                size="small"
                color={myBalance && myBalance.net_cents > 0 ? "success" : "warning"}
                label={myBalanceLabel}
              />
            )}
            {pendingInvites.length > 0 && (
              <Chip size="small" variant="outlined" label={`⏳ ${pendingInvites.length} invited`} />
            )}
          </Stack>
        </Paper>

        {homeCurrency && homeCurrency !== tripCurrency && (
          <HomeCurrencyStrip
            tripCurrency={tripCurrency}
            homeCurrency={homeCurrency}
            summaryTotalCents={summaryTotalCents}
            myBalanceCents={myBalance?.net_cents ?? 0}
            fx={homeFx}
          />
        )}

        <TripTabs
          tabs={[
            {
              label: "Members",
              content: (
                <MembersSection
                  tripId={id}
                  members={members}
                  inviteUrl={inviteUrl}
                  currentUserId={user.id}
                  pendingInvites={pendingInvites}
                  isOwner={trip.owner_id === user.id}
                />
              ),
            },
            {
              label: "Itinerary",
              content: (
                <ItinerarySection
                  tripId={id}
                  items={itineraryRows}
                  currentUserId={user.id}
                  isOwner={trip.owner_id === user.id}
                  tripCurrency={trip.main_currency ?? "USD"}
                />
              ),
            },
            {
              label: "Ideas",
              content: (
                <IdeasSection
                  tripId={id}
                  ideas={ideasWithComments}
                  currentUserId={user.id}
                  isOwner={trip.owner_id === user.id}
                  tripCurrency={trip.main_currency ?? "USD"}
                />
              ),
            },
            {
              label: "Expenses",
              content: (
                <ExpensesSection
                  tripId={id}
                  expenses={expenseRows}
                  members={members}
                  currentUserId={user.id}
                  balances={balances}
                  settlements={settlements}
                  recordedPayments={recordedPayments}
                  allSettled={allSettled}
                  tripCurrency={trip.main_currency ?? "USD"}
                  removedExpenses={removedExpenses}
                />
              ),
            },
            {
              label: "Arrivals",
              content: (
                <ArrivalsSection tripId={id} arrivals={arrivalRows} currentUserId={user.id} members={members} />
              ),
            },
          ]}
        />

        {trip.owner_id === user.id && (
          <DeleteTripButton tripId={id} tripName={trip.name} />
        )}
      </Box>
    </Container>
  );
}
