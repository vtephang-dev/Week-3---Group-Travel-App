import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getRate } from "@/utils/fx";

// Server-side rate lookup. The expense form (a client component) calls this
// same-origin, so there's no browser CORS limit; the actual Frankfurter fetch
// and the daily fx_rates cache both happen here on the server.
export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json({ error: "Missing from/to" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const fx = await getRate(supabase, from, to);
  if (!fx) {
    return NextResponse.json({ error: "Rate unavailable" }, { status: 502 });
  }
  return NextResponse.json(fx);
}
