import "./globals.css";
import Navbar from "@/app/components/Navbar";
import LayoutClient from "@/app/layout-client";

export const metadata = { title: "Nyantube", description: "Streaming Online..." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
  <SessionContextProvider supabaseClient={supabase}>
    <html lang="en">
        <head><script src="https://www.google.com/recaptcha/api.js" async defer /></head>
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
