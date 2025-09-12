"use client";

import Image from "next/image";
import Navbar from "../components/Navbar";

interface TeamMember {
  name: string;
  role: string;
  image: string;
}

const team: TeamMember[] = [
  {
    name: "Ramdan Olii",
    role: "Pengembang Frontend, backend dan integrasi data.",
    image: "/img/ramdan.jpg",
  },
  {
    name: "Israwaty Husain",
    role: "Yang ngejaga supaya Ramdan tetap waras.",
    image: "/img/israwaty.jpg",
  },
  {
    name: "Outpoot",
    role: "Pengembangan lebih lanjut.",
    image: "/img/outpoot.jpg",
  },
  {
    name: "Rizky Ibrahim",
    role: "UI Designer",
    image: "/img/rzycrimson.jpg",
  },
  {
    name: "Farel Rasjid",
    role: "Komunitas Manager, User Experience",
    image: "/img/farelkucing.jpg",
  },
  {
    name: "Top",
    role: "User Experience",
    image: "/img/top.png",
  },
  {
    name: "Atma",
    role: "Beta Tester",
    image: "/img/atma.jpg",
  },
  {
    name: "Marcello Raffael Repi",
    role: "Beta Tester",
    image: "/img/marcello.jpg",
  },
  {
    name: "Moh. Ofikurrahman",
    role: "Beta Tester",
    image: "/img/ofikur.jpg",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Navbar bawaan */}
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="bg-gray-50 rounded-2xl shadow-md p-6 sm:p-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Tentang Kami</h1>
          <p className="text-gray-600 mb-10">Hanya sebuah tim kecil.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {team.map((member) => (
              <div
                key={member.name}
                className="bg-white rounded-xl p-6 text-center shadow hover:shadow-lg transition"
              >
                <div className="w-24 h-24 mx-auto mb-4 relative">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
                <strong className="block text-lg font-semibold mb-1">
                  {member.name}
                </strong>
                <p className="text-gray-500 text-sm">{member.role}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center text-gray-500 text-sm">
        <div>
          <div className="font-bold">NyanStream</div>
          <div>© 2025 NyanStream. All rights reserved.</div>
        </div>
        <div>
          Kontak Developer?{" "}
          <a
            href="mailto:ramdanolii1410@gmail.com"
            className="text-red-500 hover:underline"
          >
            Ramdan
          </a>
        </div>
      </footer>
    </>
  );
}
