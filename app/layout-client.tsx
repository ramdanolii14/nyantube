"use client";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import React from "react";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());
  return <SessionContextProvider supabaseClient={supabaseClient}>{children}</SessionContextProvider>;
}
