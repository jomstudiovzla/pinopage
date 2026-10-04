"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Leaf, Mail, Lock, LogIn, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { authRedirectURL } from "@/lib/site-url";

type Mode = "magic" | "password";

function ConnexionForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/espace";
  const hadAuthError = searchParams.get("error") === "auth";

  const [mode, setMode] = useState<Mode>("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<null | "google" | "email">(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    hadAuthError ? { type: "err", text: "La connexion n'a pas abouti. Réessayez." } : null,
  );

  const supabase = createClient();

  async function signInWithGoogle() {
    setLoading("google");
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: authRedirectURL(next) },
    });
    if (error) {
      setLoading(null);
      setMessage({ type: "err", text: "Impossible d'ouvrir la connexion Google. Réessayez." });
    }
    // En cas de succès, le navigateur est redirigé vers Google.
  }

  async function onSubmitEmail(e: React.FormEvent) {
    e.preventDefault();
    const addr = email.trim().toLowerCase();
    if (!addr) {
      setMessage({ type: "err", text: "Saisissez votre adresse e-mail." });
      return;
    }
    setLoading("email");
    setMessage(null);

    if (mode === "magic") {
      const { error } = await supabase.auth.signInWithOtp({
        email: addr,
        options: { emailRedirectTo: authRedirectURL(next) },
      });
      setLoading(null);
      setMessage(
        error
          ? { type: "err", text: "Envoi impossible. Vérifiez l'adresse et réessayez." }
          : { type: "ok", text: "Lien de connexion envoyé ! Consultez votre boîte mail (et les Spams)." },
      );
      return;
    }

    // mode === "password"
    const { error } = await supabase.auth.signInWithPassword({ email: addr, password });
    if (error) {
      setLoading(null);
      setMessage({ type: "err", text: "E-mail ou mot de passe incorrect." });
      return;
    }
    window.location.assign(next);
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-3xl border-2 border-brand-accent/20 bg-white/90 p-8 shadow-xl backdrop-blur">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-green text-white shadow-md">
            <Leaf className="h-7 w-7" />
          </span>
          <h1 className="font-serif text-3xl font-bold text-brand-green">Espace Client</h1>
          <p className="mt-1 text-sm text-brand-charcoal/70">
            Connectez-vous pour suivre vos devis, factures et votre remise -20 %.
          </p>
        </div>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={loading !== null}
          className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-brand-accent/30 bg-white px-4 py-3 font-semibold text-brand-charcoal shadow-sm transition hover:border-brand-vivid hover:bg-brand-light disabled:opacity-60"
        >
          {loading === "google" ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
              />
            </svg>
          )}
          Continuer avec Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-brand-charcoal/40">
          <span className="h-px flex-1 bg-brand-accent/20" />
          ou
          <span className="h-px flex-1 bg-brand-accent/20" />
        </div>

        <form onSubmit={onSubmitEmail} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-brand-charcoal/70">Adresse e-mail</span>
            <span className="flex items-center gap-2 rounded-xl border-2 border-brand-accent/20 bg-white px-3 focus-within:border-brand-vivid">
              <Mail className="h-4 w-4 text-brand-accent" />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.fr"
                className="w-full bg-transparent py-3 text-sm text-brand-charcoal outline-none"
              />
            </span>
          </label>

          {mode === "password" && (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-brand-charcoal/70">Mot de passe</span>
              <span className="flex items-center gap-2 rounded-xl border-2 border-brand-accent/20 bg-white px-3 focus-within:border-brand-vivid">
                <Lock className="h-4 w-4 text-brand-accent" />
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent py-3 text-sm text-brand-charcoal outline-none"
                />
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading !== null}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-vivid px-4 py-3 font-bold text-white shadow-md transition hover:bg-brand-green disabled:opacity-60"
          >
            {loading === "email" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <LogIn className="h-5 w-5" />
            )}
            {mode === "magic" ? "Recevoir un lien de connexion" : "Se connecter"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "magic" ? "password" : "magic");
            setMessage(null);
          }}
          className="mt-4 w-full text-center text-xs font-semibold text-brand-vivid hover:underline"
        >
          {mode === "magic"
            ? "Me connecter avec un mot de passe"
            : "M'envoyer plutôt un lien magique (sans mot de passe)"}
        </button>

        {message && (
          <div
            className={`mt-4 flex items-start gap-2 rounded-xl border p-3 text-sm ${
              message.type === "ok"
                ? "border-brand-vivid/30 bg-brand-light text-brand-green"
                : "border-red-300 bg-red-50 text-red-700"
            }`}
          >
            {message.type === "ok" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-brand-charcoal/60">
        <Link href="/" className="font-semibold text-brand-vivid hover:underline">
          ← Retour au site
        </Link>
      </p>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-light via-brand-cream to-brand-light px-4 py-12">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-brand-vivid" />}>
        <ConnexionForm />
      </Suspense>
    </main>
  );
}
