import "./globals.css";
import Navbar from "@/app/components/Navbar";
import LayoutClient from "@/app/layout-client";

import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";

const supabase = createBrowserSupabaseClient();

export const metadata = {
  title: "NyanTube",
  description: "Streaming Video Online Bersama NyanTube",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionContextProvider supabaseClient={supabase}>
      <html lang="en">
        <head>
          <script src="https://www.google.com/recaptcha/api.js" async defer />
        </head>
        <body className="bg-gray-100">
          <LayoutClient>
            <Navbar />
            {children}
          </LayoutClient>
        </body>
      </html>
    </SessionContextProvider>
  );
}
