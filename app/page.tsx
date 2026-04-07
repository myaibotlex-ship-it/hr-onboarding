"use client";

import { useState } from "react";
import { PASSWORD } from "@/lib/config";
import { supabaseBrowser } from "@/lib/supabase-client";
import { UserProvider } from "@/components/UserContext";
import OnboardingApp from "@/components/OnboardingApp";
import Image from "next/image";

export default function Home() {
  const [authed, setAuthed] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [guestPw, setGuestPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGuest, setShowGuest] = useState(false);

  const handleTeamLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const { error: authError } = await supabaseBrowser.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        setError(authError.message);
      } else {
        setIsGuest(false);
        setAuthed(true);
      }
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = () => {
    if (guestPw === PASSWORD) {
      setIsGuest(true);
      setAuthed(true);
    } else {
      setError("Incorrect access password.");
    }
  };

  if (authed) {
    if (isGuest) return <OnboardingApp />;
    return (
      <UserProvider>
        <OnboardingApp />
      </UserProvider>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--gray-bg)" }}>
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="flex justify-center mb-5">
            <Image
              src="/calibrate-logo.png"
              alt="Calibrate HCM"
              width={200}
              height={60}
              style={{ height: 48, width: "auto" }}
              priority
            />
          </div>
          <div className="h-px w-16 mx-auto mb-5" style={{ background: "var(--teal)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--text-mid)" }}>HR Services Client Onboarding</p>
        </div>

        {!showGuest ? (
          <>
            {/* Team Login */}
            <div className="space-y-3 mb-4">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleTeamLogin()}
                className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all"
                style={{
                  borderColor: error ? "#e8a0a0" : "#d1d5db",
                  background: error ? "#fff0f0" : "#f9fafb",
                }}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleTeamLogin()}
                className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all"
                style={{
                  borderColor: error && !showGuest ? "#e8a0a0" : "#d1d5db",
                  background: error && !showGuest ? "#fff0f0" : "#f9fafb",
                }}
              />
            </div>

            {error && <p className="text-xs mb-3" style={{ color: "#8b0000" }}>{error}</p>}

            <button
              onClick={handleTeamLogin}
              disabled={loading}
              className="w-full py-3 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90 calibrate-gradient disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>

            <div className="mt-5 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
              <button
                onClick={() => { setShowGuest(true); setError(""); }}
                className="text-sm font-medium hover:opacity-80 transition-all"
                style={{ color: "var(--text-light)" }}
              >
                Continue as Guest →
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Guest Access */}
            <p className="text-xs text-gray-500 mb-3">Enter the shared access password</p>
            <div className="mb-4">
              <input
                type="password"
                placeholder="Enter access password"
                value={guestPw}
                onChange={(e) => { setGuestPw(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleGuestAccess()}
                className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all"
                style={{
                  borderColor: error ? "#e8a0a0" : "#d1d5db",
                  background: error ? "#fff0f0" : "#f9fafb",
                }}
              />
              {error && <p className="text-xs mt-2" style={{ color: "#8b0000" }}>{error}</p>}
            </div>

            <button
              onClick={handleGuestAccess}
              className="w-full py-3 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90 calibrate-gradient"
            >
              Continue as Guest →
            </button>

            <div className="mt-5 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
              <button
                onClick={() => { setShowGuest(false); setError(""); }}
                className="text-sm font-medium hover:opacity-80 transition-all"
                style={{ color: "var(--text-light)" }}
              >
                ← Back to Team Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
