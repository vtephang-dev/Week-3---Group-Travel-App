"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Button from "@mui/material/Button";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <Button variant="outlined" onClick={handleLogout}>
      Log out
    </Button>
  );
}
