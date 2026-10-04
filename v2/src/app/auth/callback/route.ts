import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Intercambia el `code` de OAuth / Magic Link por una sesión y redirige a `next`.
 * El `origin` se toma de la petición → funciona en cualquier dominio (.online/.com/.fr).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/espace";
  const next = nextParam.startsWith("/") ? nextParam : "/espace";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/connexion?error=auth`);
}
