import React from "react";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Tentang Kami — NyanStream",
  description:
    "Kenali tim di balik NyanStream: kreator, developer, dan komunitas yang bersemangat membangun platform streaming lokal.",
};

const TentangKami = () => {
  return (
    <div className="wrap">
      {/* Navbar dari components */}
      <Navbar />

      <main>
        <section className="card">
          <h1>Tentang Kami</h1>
          <p className="lead">Hanya sebuah tim kecil.</p>

          <div className="team-grid">
            <div className="profile-card">
              <img src="/img/ramdan.jpg" alt="Ramdan Olii" />
              <strong>Ramdan Olii</strong>
              <div className="muted">
                Pengembang Frontend, backend dan integrasi data.
              </div>
            </div>
            <div className="profile-card">
              <img src="/img/israwaty.jpg" alt="Israwaty Husain" />
              <strong>Israwaty Husain</strong>
              <div className="muted">Yang ngejaga supaya Ramdan tetap waras.</div>
            </div>
            <div className="profile-card">
              <img src="/img/outpoot.jpg" alt="Outpoot" />
              <strong>outpoot</strong>
              <div className="muted">Pengembangan lebih lanjut.</div>
            </div>
            <div className="profile-card">
              <img src="/img/rzycrimson.jpg" alt="Rizky Ibrahim" />
              <strong>Rizky Ibrahim</strong>
              <div className="muted">UI Designer</div>
            </div>
            <div className="profile-card">
              <img src="/img/farelkucing.jpg" alt="Farel Rasjid" />
              <strong>Farel Rasjid</strong>
              <div className="muted">
                Komunitas Manager, User Experience
              </div>
            </div>
            <div className="profile-card">
              <img src="/img/top.png" alt="top" />
              <strong>top</strong>
              <div className="muted">User Experience</div>
            </div>
            <div className="profile-card">
              <img src="/img/atma.jpg" alt="ATMA" />
              <strong>Atma</strong>
              <div className="muted">Beta Tester</div>
            </div>
            <div className="profile-card">
              <img src="/img/marcello.jpg" alt="Profil 8" />
              <strong>Marcello Raffael Repi</strong>
              <div className="muted">Beta Tester</div>
            </div>
            <div className="profile-card">
              <img src="/img/ofikur.jpg" alt="Profil 9" />
              <strong>Moh. Ofikurrahman</strong>
              <div className="muted">Beta Tester</div>
            </div>
          </div>
        </section>
      </main>

      <footer id="kontak">
        <div>
          <div style={{ fontWeight: 700 }}>NyanStream</div>
          <div className="small muted">
            © 2025 NyanStream. All rights reserved.
          </div>
        </div>
        <div className="small muted">
          Kontak Developer?{" "}
          <a
            href="mailto:ramdanolii1410@gmail.com"
            style={{ color: "var(--accent)", textDecoration: "none" }}
          >
            Ramdan
          </a>
        </div>
      </footer>

      {/* styled-jsx supaya gaya tetap ikut */}
      <style jsx>{`
        :root {
          --bg: #ffffff;
          --card: #f8f8f8;
          --accent: #e63946;
          --muted: #555e68;
          --glass: rgba(0, 0, 0, 0.04);
          --max-width: 1100px;
        }
        * {
          box-sizing: border-box;
        }
        .wrap {
          max-width: var(--max-width);
          margin: 40px auto;
          padding: 24px;
        }
        .card {
          margin-top: 50px;
          background: var(--card);
          border-radius: 16px;
          padding: 26px;
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
        }
        h1 {
          font-size: 34px;
          margin: 0 0 16px 0;
          line-height: 1.05;
        }
        p.lead {
          color: var(--muted);
          margin: 0 0 18px 0;
        }
        .team-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          margin-top: 20px;
        }
        .profile-card {
          background: #fdfdfd;
          border-radius: 12px;
          padding: 18px;
          text-align: center;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
        }
        .profile-card img {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          object-fit: cover;
          margin-bottom: 12px;
        }
        .profile-card strong {
          display: block;
          margin-bottom: 6px;
          font-size: 16px;
        }
        .profile-card .muted {
          font-size: 14px;
          color: var(--muted);
        }
        footer {
          margin-top: 40px;
          padding-top: 16px;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: var(--muted);
        }
        @media (max-width: 900px) {
          .team-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 560px) {
          .team-grid {
            grid-template-columns: 1fr;
          }
          .wrap {
            margin: 20px 16px;
          }
          h1 {
            font-size: 28px;
          }
        }
        .small {
          font-size: 13px;
        }
      `}</style>
    </div>
  );
};

export default TentangKami;
