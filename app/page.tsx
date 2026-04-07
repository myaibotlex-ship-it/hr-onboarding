"use client";

import { useState } from "react";
import { PASSWORD } from "@/lib/config";
import OnboardingApp from "@/components/OnboardingApp";
import Image from "next/image";

export default function Home() {
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  if (authed) return <OnboardingApp />;

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
          className="w-full py-3 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90 calibrate-gradient"
        >
          Sign In →
        </button>
      </div>
    </div>
  );
}
