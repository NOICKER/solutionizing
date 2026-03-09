"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/context/AuthContext";

type AuthMode = "signin" | "signup";

function normalizeRole(value: string | null): UserRole {
  return value === "tester" ? "tester" : "founder";
}

function normalizeMode(value: string | null): AuthMode {
  return value === "signup" ? "signup" : "signin";
}

export default function AuthPage() {
  const router = useRouter();
  const { auth, signIn } = useAuth();

  const [role, setRole] = useState<UserRole>("founder");
  const [mode, setMode] = useState<AuthMode>("signin");
  const [nextPath, setNextPath] = useState("/dashboard/founder");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const modeLabel = mode === "signin" ? "Welcome Back" : "Create Account";
  const modeButton = mode === "signin" ? "Sign In" : "Sign Up";
  const modePrompt =
    mode === "signin"
      ? "Don't have an account?"
      : "Already have an account?";
  const modeSwitchLabel = mode === "signin" ? "Join Us" : "Sign In";

  const switchHref = useMemo(() => {
    const params = new URLSearchParams({
      mode: mode === "signin" ? "signup" : "signin",
      role,
      next: nextPath
    });
    return `/auth?${params.toString()}`;
  }, [mode, nextPath, role]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextRole = normalizeRole(params.get("role"));
    const nextMode = normalizeMode(params.get("mode"));
    const fallback = nextRole === "tester" ? "/dashboard/tester" : "/dashboard/founder";
    const target = params.get("next") || fallback;

    setRole(nextRole);
    setMode(nextMode);
    setNextPath(target);
  }, []);

  useEffect(() => {
    if (auth.hydrated && auth.isAuthenticated) {
      router.replace(nextPath);
    }
  }, [auth.hydrated, auth.isAuthenticated, nextPath, router]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    signIn(role);
    router.push(nextPath);
  };

  const handleSocial = () => {
    signIn(role);
    router.push(nextPath);
  };

  return (
    <main className="min-h-screen bg-[#efede8] px-6 py-8">
      <div className="mx-auto flex min-h-[74vh] max-w-[980px] items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[24px] border border-secondary/20 bg-[#f6f4f0] shadow-[0_28px_60px_-30px_rgba(0,0,0,0.25)] md:grid-cols-[0.42fr,0.58fr]">
          <aside className="flex min-h-[500px] flex-col items-center justify-between bg-[#ddb395] px-8 py-9 text-center">
            <div className="mt-3 rounded-full bg-[#f3d8c7] p-7 text-primary">
              <span className="material-symbols-outlined text-5xl">energy_savings_leaf</span>
            </div>

            <div>
              <h1 className="mb-3 text-4xl font-extrabold leading-tight text-text-main">
                Turn Uncertainty into Decisions
              </h1>
              <p className="mx-auto max-w-xs text-xl leading-relaxed text-text-main/70">
                The supportive launchpad for your next big thing.
              </p>
            </div>

            <div className="text-xl font-black uppercase tracking-[0.2em] text-text-main/35">
              Solutionizing
            </div>
          </aside>

          <section className="px-8 py-9 md:px-12">
            <h2 className="text-5xl font-extrabold tracking-tight text-text-main">
              {modeLabel}
            </h2>

            <p className="mt-3 text-xl text-text-main/60">
              {modePrompt}{" "}
              <Link href={switchHref} className="font-bold text-primary">
                {modeSwitchLabel}
              </Link>
            </p>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleSocial}
                className="rounded-2xl border border-secondary/25 bg-white px-4 py-3.5 text-lg font-bold text-text-main transition-colors hover:bg-neutral-bg"
              >
                Google
              </button>
              <button
                type="button"
                onClick={handleSocial}
                className="rounded-2xl border border-secondary/25 bg-white px-4 py-3.5 text-lg font-bold text-text-main transition-colors hover:bg-neutral-bg"
              >
                GitHub
              </button>
            </div>

            <div className="my-6 flex items-center gap-4 text-sm font-bold uppercase tracking-[0.2em] text-text-main/50">
              <div className="h-px flex-1 bg-secondary/30" />
              <span>or email</span>
              <div className="h-px flex-1 bg-secondary/30" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-lg font-bold uppercase tracking-[0.15em] text-text-main/60">
                  Email Address
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="alex@example.com"
                  className="w-full rounded-2xl border border-secondary/25 bg-white px-6 py-4 text-xl text-text-main outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
                />
              </label>

              <label className="block">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-lg font-bold uppercase tracking-[0.15em] text-text-main/60">
                    Password
                  </span>
                  <button
                    type="button"
                    className="text-base font-semibold text-text-main/60 hover:text-text-main"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                  className="w-full rounded-2xl border border-secondary/25 bg-white px-6 py-4 text-xl text-text-main outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
                />
              </label>

              <button
                type="submit"
                className="w-full rounded-full bg-[#d77a57] px-8 py-3.5 text-3xl font-extrabold text-white shadow-cta-orange transition-all hover:brightness-95"
              >
                {modeButton}
              </button>
            </form>

            <p className="mt-6 text-center text-base text-text-main/55">
              By continuing, you agree to our{" "}
              <Link href="/terms" className="font-semibold underline underline-offset-2">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-semibold underline underline-offset-2">
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 rounded-full border border-secondary/25 bg-[#e3ece7] px-6 py-3 text-lg font-semibold text-[#2f7367] shadow-sm">
        <span className="material-symbols-outlined mr-2 align-[-2px] text-base">
          shield_lock
        </span>
        Encrypted Connection Active
      </div>
    </main>
  );
}
