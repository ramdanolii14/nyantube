import "./globals.css";
import Navbar from "@/app/components/Navbar";

export const metadata = {
  title: "NyanStream - Online Video Sharing For Everyone",
  description:
    "Streaming Online Tanpa Batas Bersama NyanTube. Powerfull video platform, only for Sigma. Share your moment here, make memories with us. We all are like family here.",
  alternates: {
    canonical: "https://nyanstream.my.id/", //update canonical huhuhu capek jir
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
