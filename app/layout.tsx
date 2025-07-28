import "./globals.css";
import Navbar from "@/app/components/Navbar";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { useState } from "react";

export const metadata = {
  title: "Nyantube",
  description: "Streaming Online Tanpa Batas Bersama Nyantube. Powerfull video platform, only for Sigma.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());

  return (
    <html lang="en">
      <head>
        {/* ✅ Script reCAPTCHA */}
        <script src="https://www.google.com/recaptcha/api.js" async defer></script>
      </head>
      <body className="bg-gray-100">
        <SessionContextProvider supabaseClient={supabaseClient}>
          <Navbar />
          {children}
        </SessionContextProvider>
      </body>
    </html>
  );
}
