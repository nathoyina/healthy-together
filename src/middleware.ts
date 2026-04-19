import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

function isPublicPath(path: string) {
  if (path === "/" || path === "/login" || path === "/register") return true;
  if (path.startsWith("/auth/")) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next();
  }

  const { supabaseResponse, user, supabase } = await updateSession(request);
  const path = request.nextUrl.pathname;

  if (!user && !isPublicPath(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && (path === "/login" || path === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (
    user &&
    path !== "/onboarding" &&
    path !== "/login" &&
    !path.startsWith("/auth/") &&
    !isPublicPath(path)
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, onboarding_completed_at")
      .eq("id", user.id)
      .maybeSingle();

    const needsOnboarding =
      !profile?.username || !profile?.onboarding_completed_at;

    if (needsOnboarding) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
