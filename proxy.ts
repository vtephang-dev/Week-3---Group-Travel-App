import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/proxy";

// Next.js 16 renamed "middleware" to "proxy". This runs on every request
// (except static files) to keep the Supabase session fresh.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico and image files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
