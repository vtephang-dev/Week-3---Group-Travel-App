import { convertCents, type FxRate } from "@/utils/fx";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

// Shows the trip's money in the viewer's chosen home currency — a rough,
// read-only side-by-side. Never changes what anyone owes (ticket 3.2.3).
// The rate is fetched on the server (see page.tsx) to avoid browser CORS limits;
// this component only displays it.
export default function HomeCurrencyStrip({
  tripCurrency,
  homeCurrency,
  summaryTotalCents,
  myBalanceCents,
  fx,
}: {
  tripCurrency: string;
  homeCurrency: string;
  summaryTotalCents: number;
  myBalanceCents: number;
  fx: FxRate | null;
}) {
  const fmt = (cents: number) => `${homeCurrency} ${(cents / 100).toFixed(2)}`;

  if (!fx) {
    return (
      <Paper variant="outlined" sx={{ p: 2, bgcolor: "action.hover" }}>
        <Typography variant="body2" color="text.secondary">
          Couldn&apos;t load today&apos;s {tripCurrency}→{homeCurrency} rate — showing
          amounts in {tripCurrency} only.
        </Typography>
      </Paper>
    );
  }

  const totalHome = convertCents(summaryTotalCents, fx.rate);
  const balanceHome = convertCents(Math.abs(myBalanceCents), fx.rate);

  return (
    <Paper variant="outlined" sx={{ p: 2, bgcolor: "action.hover" }}>
      <Typography variant="overline" color="text.secondary">
        Roughly, in your home currency ({homeCurrency})
      </Typography>
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 2, mt: 0.5 }}>
        {summaryTotalCents > 0 && (
          <Typography variant="body2">
            <strong>≈ {fmt(totalHome)}</strong> total
          </Typography>
        )}
        {myBalanceCents !== 0 && (
          <Typography variant="body2">
            {myBalanceCents > 0 ? "you're owed" : "you owe"}{" "}
            <strong>≈ {fmt(balanceHome)}</strong>
          </Typography>
        )}
      </Stack>
      <Typography variant="caption" color="text.secondary">
        Approximate · 1 {tripCurrency} = {fx.rate} {homeCurrency} · rate as of{" "}
        {fx.rateDate} (Frankfurter). Everyone still settles up in {tripCurrency}.
      </Typography>
    </Paper>
  );
}
