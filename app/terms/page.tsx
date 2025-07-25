export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto mt-20 p-5 bg-white shadow-md rounded-md">
      <h1 className="text-2xl font-bold mb-4">Terms of Service</h1>
      <p className="mb-4 text-sm text-gray-600">
        Selamat datang di <strong>Nyantube</strong>. Dengan menggunakan layanan ini, Anda setuju untuk mematuhi syarat dan ketentuan berikut.
      </p>
      <h2 className="text-lg font-semibold mt-4">1. Penggunaan Layanan</h2>
      <p className="text-sm text-gray-700">
        Anda bertanggung jawab atas semua aktivitas di akun Anda. Konten yang melanggar hukum, kekerasan, atau hak cipta akan dihapus
        tanpa pemberitahuan.
      </p>
      <h2 className="text-lg font-semibold mt-4">2. Hak Cipta</h2>
      <p className="text-sm text-gray-700">
        Anda hanya boleh mengunggah konten yang Anda miliki atau memiliki izin untuk dibagikan. Pelanggaran hak cipta akan ditindak sesuai
        hukum yang berlaku.
      </p>
      <h2 className="text-lg font-semibold mt-4">3. Perubahan</h2>
      <p className="text-sm text-gray-700">
        Kami dapat mengubah syarat ini sewaktu-waktu. Perubahan akan diberitahukan melalui situs ini.
      </p>
      <h2 className="text-lg font-semibold mt-4">4. Hukum yang Berlaku</h2>
      <p className="text-sm text-gray-700">
        Layanan ini mengikuti hukum yang berlaku di negara tempat layanan ini dioperasikan.
      </p>
      <h2 className="text-lg font-semibold mt-4">5. Penggunaan nama aneh.</h2>
      <p className="text-sm text-gray-700">
        Kami melarang penggunaan nama-nama aneh seperti penggunaan kata-kata kasar, jorok, tidak sesuai dengan norma sosial. Akan langsung terkena permanent banned dari kami.
      </p>
      <p className="text-xs text-gray-500 mt-6">Terakhir diperbarui: {new Date().toLocaleDateString()}</p>
    </div>
  );
}
