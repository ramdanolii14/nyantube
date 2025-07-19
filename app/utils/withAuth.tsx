"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabase/client";

export default function withAuth(Component: React.FC) {
  return function ProtectedPage(props: any) {
    const [loading, setLoading] = useState(true);
    const [loggedIn, setLoggedIn] = useState(false);
    const router = useRouter();

    useEffect(() => {
      const checkSession = async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/auth/login");
        } else {
          setLoggedIn(true);
        }
        setLoading(false);
      };

      checkSession();
    }, [router]);

    if (loading) {
      return <p className="p-6">Memeriksa sesi...</p>;
    }

    return loggedIn ? <Component {...props} /> : null;
  };
}
