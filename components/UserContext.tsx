"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useUser, type UserProfile } from "@/lib/auth";

interface UserContextValue {
  user: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const UserCtx = createContext<UserContextValue>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const value = useUser();
  return <UserCtx.Provider value={value}>{children}</UserCtx.Provider>;
}

export function useCurrentUser() {
  return useContext(UserCtx);
}
