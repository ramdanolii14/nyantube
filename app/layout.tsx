import "./globals.css";
import Navbar from "@/app/components/Navbar";

export const metadata = {
  title: "NyanTube",
  description: "Streaming Online Tanpa Batas Bersama NyanTube. Powerfull video platform, only for Sigma.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
      </head>
      <body className="bg-gray-100">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
