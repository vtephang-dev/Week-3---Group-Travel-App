"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";

export type Expense = {
  id: string;
  description: string;
  amount_cents: number;
  paid_by: string;
  payer_name: string;
};

export type Member = { user_id: string; name: string };

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ExpensesSection({
  tripId,
  expenses,
  members,
  currentUserId,
}: {
  tripId: string;
  expenses: Expense[];
  members: Member[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const dollars = parseFloat(amount);
    if (isNaN(dollars) || dollars < 0) {
      return setError("Enter a valid amount.");
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("expenses").insert({
      trip_id: tripId,
      description,
      amount_cents: Math.round(dollars * 100),
    });
    setLoading(false);
    if (error) return setError(error.message);
    setDescription("");
    setAmount("");
    router.refresh();
  }

  // Even split: each member owes an equal share of the total.
  const total = expenses.reduce((sum, e) => sum + e.amount_cents, 0);
  const perPerson = members.length > 0 ? total / members.length : 0;
  const paidBy: Record<string, number> = {};
  for (const e of expenses) {
    paidBy[e.paid_by] = (paidBy[e.paid_by] ?? 0) + e.amount_cents;
  }

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Expenses
      </Typography>

      {expenses.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No expenses yet. Add one and it splits evenly across the group.
        </Typography>
      ) : (
        <>
          <List dense>
            {expenses.map((e) => (
              <ListItem key={e.id} divider>
                <ListItemText primary={e.description} secondary={`Paid by ${e.payer_name}`} />
                <Typography>{money(e.amount_cents)}</Typography>
              </ListItem>
            ))}
          </List>

          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="subtitle2">
              Total: {money(total)} · Even share each: {money(Math.round(perPerson))}
            </Typography>
          </Box>

          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Balances (even split)
          </Typography>
          <Stack spacing={0.5} sx={{ mb: 2 }}>
            {members.map((m) => {
              const net = (paidBy[m.user_id] ?? 0) - perPerson;
              const label =
                net > 0
                  ? `is owed ${money(Math.round(net))}`
                  : net < 0
                    ? `owes ${money(Math.round(-net))}`
                    : "is settled up";
              return (
                <Typography key={m.user_id} variant="body2">
                  {m.name}
                  {m.user_id === currentUserId ? " (you)" : ""} {label}
                </Typography>
              );
            })}
          </Stack>
        </>
      )}

      <Box component="form" onSubmit={addExpense}>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="What was it for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            fullWidth
            size="small"
            placeholder="Dinner at the ramen place"
          />
          <TextField
            label="Amount (USD)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            size="small"
            placeholder="48.50"
            inputMode="decimal"
          />
          <Button type="submit" variant="contained" disabled={loading} sx={{ alignSelf: "flex-start" }}>
            {loading ? "Adding…" : "Add expense"}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
