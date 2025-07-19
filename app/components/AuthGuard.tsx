"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";

interface User {
  id: string;
  email: string;
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = "/auth/login";
      } else {
        setUser({ id: data.user.id, email: data.user.email! });
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return <>{children}</>;
}
