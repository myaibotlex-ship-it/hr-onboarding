"use client";

import { useState, useEffect, useCallback } from "react";
import { supabaseBrowser } from "./supabase-client";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "consultant";
  avatar_color: string;
  created_at: string;
}

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session?.user || cancelled) {
        setLoading(false);
        return;
      }

      const { data } = await supabaseBrowser
        .from("hr_onboarding_users")
        .select("*")
        .eq("email", session.user.email)
        .single();

      if (!cancelled) {
        setUser(data as UserProfile | null);
        setLoading(false);
      }
    }

    load();

    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          setUser(null);
          setLoading(false);
        } else {
          load();
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabaseBrowser.auth.signOut();
    setUser(null);
  }, []);

  return { user, loading, signOut };
}
