import React from "react";

const TentangKami: React.FC = () => {
  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Tentang Kami — NyanStream</title>
        <meta
          name="description"
          content="Kenali tim di balik NyanStream: kreator, developer, dan komunitas yang bersemangat membangun platform streaming lokal."
        />
        <link rel="icon" href="data:;base64,iVBORw0KGgo=" />
        <style>{`
          :root{
            --bg:#ffffff; --card:#f8f8f8; --accent:#e63946; --muted:#555e68; --glass: rgba(0,0,0,0.04);
            --max-width:1100px;
          }
          *{box-sizing:border-box}
          html,body{height:100%;margin:0;font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; background:#ffffff; color:#1a1a1a}
          .wrap{max-width:var(--max-width);margin:40px auto;padding:24px}

          /* header */
          header{display:flex;gap:16px;align-items:center;justify-content:space-between}
          .brand{display:flex;gap:12px;align-items:center}
          .logo img{width:52px;height:52px;border-radius:12px;object-fit:cover}
          nav{display:flex;gap:14px;align-items:center}
          a.btn{background:linear-gradient(90deg,var(--accent),#ff7f7f);padding:10px 14px;border-radius:10px;color:#fff;text-decoration:none;font-weight:600}
          a.ghost{padding:8px 12px;border-radius:10px;color:var(--muted);text-decoration:none}

          /* card */
          .card{margin-top:50px;background:var(--card);border-radius:16px;padding:26px;box-shadow:0 6px 24px rgba(0,0,0,0.1)}

          h1{font-size:34px;margin:0 0 16px 0;line-height:1.05}
          p.lead{color:var(--muted);margin:0 0 18px 0}

          /* grid profiles */
          .team-grid {
            display: grid;
            grid-template-columns: repeat(3,1fr);
            gap: 18px;
            margin-top: 20px;
          }
          .profile-card {
            background:#fdfdfd;
            border-radius:12px;
            padding:18px;
            text-align:center;
            box-shadow:0 4px 14px rgba(0,0,0,0.06);
          }
          .profile-card img {
            width:90px;
            height:90px;
            border-radius:50%;
            object-fit:cover;
            margin-bottom:12px;
          }
          .profile-card strong {
            display:block;
            margin-bottom:6px;
            font-size:16px;
          }
          .profile-card .muted {
            font-size:14px;
            color:var(--muted);
          }

          /* footer */
          footer{margin-top:40px;padding-top:16px;border-top:1px solid rgba(0,0,0,0.08);display:flex;justify-content:space-between;align-items:center;color:var(--muted)}

          /* responsiveness */
          @media (max-width:900px){
            .team-grid{grid-template-columns:repeat(2,1fr)}
          }
          @media (max-width:560px){
            .team-grid{grid-template-columns:1fr}
            .brand span{display:none}
            .wrap{margin:20px 16px}
            h1{font-size:28px}
          }

          .small{font-size:13px}
        `}</style>
      </head>
      <body>
        <div className="wrap">
          <header>
            <div className="brand">
              <div className="logo">
                <img src="img/logo.png" alt="NyanStream Logo" />
              </div>
              <div>
                <strong>NyanStream</strong>
                <div className="small muted">Komunitas</div>
              </div>
            </div>
            <nav>
              <a className="ghost" href="./">Beranda</a>
              <a className="ghost" href="./team.html">Tentang Kami</a>
              <a className="btn" href="https://www.nyanstream.my.id">Daftar</a>
            </nav>
          </header>

          <main>
            <section className="card">
              <h1>Tentang Kami</h1>
              <p className="lead">Hanya sebuah tim kecil.</p>

              <div className="team-grid">
                <div className="profile-card">
                  <img src="/img/ramdan.jpg" alt="Ramdan Olii" />
                  <strong>Ramdan Olii</strong>
                  <div className="muted">Pengembang Frontend, backend dan integrasi data.</div>
                </div>
                <div className="profile-card">
                  <img src="img/israwaty.jpg" alt="Israwaty Husain" />
                  <strong>Israwaty Husain</strong>
                  <div className="muted">Yang ngejaga supaya Ramdan tetap waras.</div>
                </div>
                <div className="profile-card">
                  <img src="img/outpoot.jpg" alt="Outpoot" />
                  <strong>outpoot</strong>
                  <div className="muted">Pengembangan lebih lanjut.</div>
                </div>
                <div className="profile-card">
                  <img src="img/rzycrimson.jpg" alt="Rizky Ibrahim" />
                  <strong>Rizky Ibrahim</strong>
                  <div className="muted">UI Designer</div>
                </div>
                <div className="profile-card">
                  <img src="img/farelkucing.jpg" alt="Farel Rasjid" />
                  <strong>Farel Rasjid</strong>
                  <div className="muted">Komunitas Manager, User Experience</div>
                </div>
                <div className="profile-card">
                  <img src="img/top.png" alt="top" />
                  <strong>top</strong>
                  <div className="muted">User Experience</div>
                </div>
                <div className="profile-card">
                  <img src="img/atma.jpg" alt="ATMA" />
                  <strong>Atma</strong>
                  <div className="muted">Beta Tester</div>
                </div>
                <div className="profile-card">
                  <img src="img/marcello.jpg" alt="Profil 8" />
                  <strong>Marcello Raffael Repi</strong>
                  <div className="muted">Beta Tester</div>
                </div>
                <div className="profile-card">
                  <img src="img/ofikur.jpg" alt="Profil 9" />
                  <strong>Moh. Ofikurrahman</strong>
                  <div className="muted">Beta Tester</div>
                </div>
              </div>
            </section>
          </main>

          <footer id="kontak">
            <div>
              <div style={{ fontWeight: 700 }}>NyanStream</div>
              <div className="small muted">© 2025 NyanStream. All rights reserved.</div>
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
        </div>
      </body>
    </html>
  );
};

export default TentangKami;
