export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto mt-20 p-5 bg-white shadow-md rounded-md">
      <h1 className="text-2xl font-bold mb-4">Kontak Kami</h1>
      <p className="text-sm text-gray-600 mb-4">
        Jika Anda memiliki pertanyaan, keluhan, atau masalah hukum terkait <strong>Nyantube</strong>, silakan hubungi kami melalui salah satu metode di bawah ini.
      </p>

      <h2 className="text-lg font-semibold mt-4">Email Resmi</h2>
      <p className="text-sm text-gray-700">📧 ramdan.personal@gmail.com</p>

      <h2 className="text-lg font-semibold mt-4">Media Sosial</h2>
      <p className="text-sm text-gray-700">
        📷 Instagram: <a href="https://instagram.com/alyciaperucia" target="_blank" className="text-blue-600 hover:underline">@alyciaperucia</a><br />
      </p>

      <h2 className="text-lg font-semibold mt-4">Alamat Kantor</h2>
      <p className="text-sm text-gray-700">
        Saat ini hanya tersedia online.
      </p>

      <h2 className="text-lg font-semibold mt-4">Laporan Darurat</h2>
      <p className="text-sm text-red-600">
        ❗ Untuk laporan pelanggaran serius atau masalah hukum mendesak, harap kirim email dengan subjek "URGENT: Laporan Hukum".
      </p>

      <p className="text-xs text-gray-500 mt-6">Terakhir diperbarui: {new Date().toLocaleDateString()}</p>
    </div>
  );
}
