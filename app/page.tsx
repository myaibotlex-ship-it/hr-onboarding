"use client";

import { useState } from "react";
import { PASSWORD } from "@/lib/config";
import OnboardingApp from "@/components/OnboardingApp";

export default function Home() {
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  if (authed) return <OnboardingApp />;

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}>
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md"
            style={{ background: "var(--navy)" }}
          >
            <span className="text-2xl">📋</span>
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--navy)" }}>
            Calibrate<span style={{ color: "var(--gold)" }}>HCM</span>
          </h1>
          <p className="text-sm text-gray-500">HR Services Client Onboarding</p>
        </div>

        <div className="mb-4">
          <input
            type="password"
            placeholder="Enter access password"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(false); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (input === PASSWORD) setAuthed(true);
                else setError(true);
              }
            }}
            className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all"
            style={{
              borderColor: error ? "#e8a0a0" : "#d1d5db",
              background: error ? "#fff0f0" : "#f9fafb",
            }}
          />
          {error && <p className="text-xs mt-2" style={{ color: "#8b0000" }}>Incorrect password. Try again.</p>}
        </div>

        <button
          onClick={() => {
            if (input === PASSWORD) setAuthed(true);
            else setError(true);
          }}
          className="w-full py-3 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90"
          style={{ background: "var(--navy)" }}
        >
          Sign In →
        </button>
      </div>
    </div>
  );
}
