import "./globals.css";
import Navbar from "@/app/components/Navbar";

export const metadata = {
  title: "Nyantube",
  description: "Streaming Online Tanpa Batas Bersama Nyantube. Powerfull video platform, only for Sigma.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* ✅ Script reCAPTCHA */}
        <script src="https://www.google.com/recaptcha/api.js" async defer></script>
      </head>
      <body className="bg-gray-100">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
