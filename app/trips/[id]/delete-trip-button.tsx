"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Alert from "@mui/material/Alert";

// Owner-only "delete this trip" control. The database already enforces
// owner-only deletes (RLS) and cascades all the trip's data, so this just needs
// to ask for confirmation and send the delete.
export default function DeleteTripButton({
  tripId,
  tripName,
}: {
  tripId: string;
  tripName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("trips").delete().eq("id", tripId);
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }
    // Trip (and all its data) are gone — back to the dashboard.
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, borderColor: "error.light" }}>
      <Typography variant="overline" color="error">
        Danger zone
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="body2" color="text.secondary">
          Deleting this trip removes it and all its plans, ideas, expenses and
          arrivals for everyone. This can&apos;t be undone.
        </Typography>
        <Button color="error" variant="outlined" size="small" onClick={() => setOpen(true)}>
          Delete trip
        </Button>
      </Box>

      <Dialog open={open} onClose={() => !loading && setOpen(false)}>
        <DialogTitle>Delete &ldquo;{tripName}&rdquo;?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This permanently removes the trip and everything in it — members,
            plans, ideas, expenses, and arrivals — for everyone. This cannot be
            undone.
          </DialogContentText>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting…" : "Delete trip"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
