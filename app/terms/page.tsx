export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto mt-20 p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold mb-6">Terms of Service / Syarat dan Ketentuan</h1>
      <p className="mb-6 text-sm text-gray-600">
        Welcome to <strong>Nyanstream</strong>. By accessing and using our services, you agree to comply with the terms and conditions outlined below.  
        Selamat datang di <strong>Nyanstream</strong>. Dengan mengakses dan menggunakan layanan kami, Anda setuju untuk mematuhi syarat dan ketentuan yang tercantum di bawah ini.
      </p>

      {/* Section 1 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">1. Account Responsibility / Tanggung Jawab Akun</h2>
      <p className="text-sm text-gray-700 mb-4">
        EN: You are responsible for maintaining the confidentiality of your account credentials and all activities under your account.  
        ID: Anda bertanggung jawab untuk menjaga kerahasiaan kredensial akun Anda dan semua aktivitas yang dilakukan melalui akun Anda.
      </p>

      {/* Section 2 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">2. Content Policy / Kebijakan Konten</h2>
      <p className="text-sm text-gray-700 mb-4">
        EN: You may only upload content you own or have permission to distribute. Content that violates copyright, promotes violence, discrimination, or illegal activities is strictly prohibited.  
        ID: Anda hanya boleh mengunggah konten yang Anda miliki atau memiliki izin untuk membagikannya. Konten yang melanggar hak cipta, mempromosikan kekerasan, diskriminasi, atau aktivitas ilegal sangat dilarang.
      </p>

      {/* Section 3 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">3. Prohibited Activities / Aktivitas yang Dilarang</h2>
      <ul className="list-disc pl-5 text-sm text-gray-700 mb-4">
        <li>EN: Using bots, scrapers, or automation tools to access the service.  
            ID: Menggunakan bot, scraper, atau alat otomatisasi untuk mengakses layanan.</li>
        <li>EN: Uploading harmful code, viruses, or malware.  
            ID: Mengunggah kode berbahaya, virus, atau malware.</li>
        <li>EN: Harassing or bullying other users.  
            ID: Mengganggu atau melakukan perundungan terhadap pengguna lain.</li>
        <li>EN: Creating fake accounts or impersonating others.  
            ID: Membuat akun palsu atau menyamar sebagai orang lain.</li>
      </ul>

      {/* Section 4 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">4. Intellectual Property / Hak Kekayaan Intelektual</h2>
      <p className="text-sm text-gray-700 mb-4">
        EN: All trademarks, service marks, and logos displayed on Nyanstream are the property of their respective owners.  
        ID: Semua merek dagang, merek layanan, dan logo yang ditampilkan di Nyanstream adalah milik pemiliknya masing-masing.
      </p>

      {/* Section 5 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">5. Termination / Penghentian Akun</h2>
      <p className="text-sm text-gray-700 mb-4">
        EN: We reserve the right to suspend or terminate accounts that violate our Terms of Service without prior notice.  
        ID: Kami berhak untuk menangguhkan atau menghentikan akun yang melanggar Syarat dan Ketentuan kami tanpa pemberitahuan sebelumnya.
      </p>

      {/* Section 6 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">6. Limitation of Liability / Batasan Tanggung Jawab</h2>
      <p className="text-sm text-gray-700 mb-4">
        EN: Nyanstream is not responsible for damages arising from the use or inability to use the service.  
        ID: Nyanstream tidak bertanggung jawab atas kerugian yang timbul dari penggunaan atau ketidakmampuan menggunakan layanan.
      </p>

      {/* Section 7 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">7. Privacy Policy / Kebijakan Privasi</h2>
      <p className="text-sm text-gray-700 mb-4">
        EN: Your privacy is important to us. Please read our Privacy Policy to understand how we collect, use, and protect your information.  
        ID: Privasi Anda penting bagi kami. Harap baca Kebijakan Privasi kami untuk memahami bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda.
      </p>

      {/* Section 8 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">8. Changes to Terms / Perubahan Ketentuan</h2>
      <p className="text-sm text-gray-700 mb-4">
        EN: We may revise these terms from time to time. Significant changes will be notified via email or posted on our website.  
        ID: Kami dapat merevisi ketentuan ini dari waktu ke waktu. Perubahan signifikan akan diberitahukan melalui email atau diposting di situs web kami.
      </p>

      {/* Section 9 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">9. Governing Law / Hukum yang Berlaku</h2>
      <p className="text-sm text-gray-700 mb-4">
        EN: These Terms of Service are governed by the laws of the country in which Nyanstream operates.  
        ID: Syarat dan Ketentuan ini diatur oleh hukum negara tempat Nyanstream beroperasi.
      </p>

      {/* Section 10 */}
      <h2 className="text-xl font-semibold mt-6 mb-2">10. Contact Information / Informasi Kontak</h2>
      <p className="text-sm text-gray-700 mb-4">
        EN: For questions regarding these terms, contact us at <a href="mailto:dev@ramdan.fun" className="text-blue-500 underline">dev@ramdan.fun</a>.  
        ID: Untuk pertanyaan terkait ketentuan ini, hubungi kami di <a href="mailto:dev@ramdan.fun" className="text-blue-500 underline">dev@ramdan.fun</a>.
      </p>

      {/* Update Date */}
      <p className="text-xs text-gray-500 mt-10">
        Last Updated / Terakhir Diperbarui: {new Date().toLocaleDateString()}
      </p>
    </div>
  );
}

