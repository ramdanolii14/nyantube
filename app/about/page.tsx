"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Head from "next/head";

export default function KontributorPage() {
  const contributors = [
    {
      name: "Ramdan Olii",
      role: "Founder & Developer",
      img: "/images/profiles/ramdan.png",
    },
    {
      name: "Icha",
      role: "UI/UX Designer",
      img: "/images/profiles/icha.png",
    },
    {
      name: "Naufal",
      role: "Backend Engineer",
      img: "/images/profiles/naufal.png",
    },
    {
      name: "Raisa",
      role: "Frontend Engineer",
      img: "/images/profiles/raisa.png",
    },
    {
      name: "Dika",
      role: "DevOps & Cloud",
      img: "/images/profiles/dika.png",
    },
    {
      name: "Fina",
      role: "Content Manager",
      img: "/images/profiles/fina.png",
    },
    {
      name: "Rudi",
      role: "QA & Testing",
      img: "/images/profiles/rudi.png",
    },
    {
      name: "Sinta",
      role: "Community Manager",
      img: "/images/profiles/sinta.png",
    },
    {
      name: "Budi",
      role: "Security Engineer",
      img: "/images/profiles/budi.png",
    },
  ];

  return (
    <>
      <Head>
        <title>Tentang Kami — NyanStream</title>
        <meta
          name="description"
          content="Kenali tim di balik NyanStream: kreator, developer, dan komunitas yang bersemangat membangun platform streaming lokal."
        />
      </Head>

      <Navbar />
      <main className="max-w-6xl mx-auto mt-20 p-5">
        <h1 className="text-3xl font-bold mb-8 text-center">Tim Kontributor</h1>
        <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">
          Kami adalah tim kecil namun penuh semangat yang membangun{" "}
          <strong>NyanStream</strong>. Dari developer hingga content manager,
          setiap kontributor berperan penting dalam menjaga platform tetap hidup
          dan bermanfaat.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {contributors.map((c, idx) => (
            <div
              key={idx}
              className="p-6 bg-white shadow-md rounded-xl text-center hover:shadow-lg transition-shadow"
            >
              <img
                src={c.img}
                alt={c.name}
                className="w-28 h-28 rounded-full mx-auto mb-4 object-cover"
              />
              <h2 className="text-lg font-semibold">{c.name}</h2>
              <p className="text-sm text-gray-600">{c.role}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 mt-12 text-center">
          Terakhir diperbarui: {new Date().toLocaleDateString()}
        </p>
      </main>
    </>
  );
}
