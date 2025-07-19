export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto mt-20 p-5 bg-white shadow-md rounded-md">
      <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
      <p className="mb-4 text-sm text-gray-600">
        Privasi Anda penting bagi kami. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data Anda.
      </p>
      <h2 className="text-lg font-semibold mt-4">1. Data yang Kami Kumpulkan</h2>
      <p className="text-sm text-gray-700">
        Kami hanya mengumpulkan data yang diperlukan seperti nama pengguna, email, dan avatar. Kami tidak menjual atau membagikan data Anda
        ke pihak ketiga.
      </p>
      <h2 className="text-lg font-semibold mt-4">2. Penggunaan Data</h2>
      <p className="text-sm text-gray-700">
        Data digunakan untuk mengelola akun Anda, menampilkan profil, dan meningkatkan layanan.
      </p>
      <h2 className="text-lg font-semibold mt-4">3. Keamanan</h2>
      <p className="text-sm text-gray-700">
        Kami menggunakan langkah keamanan standar industri untuk melindungi data Anda.
      </p>
      <h2 className="text-lg font-semibold mt-4">4. Hak Anda</h2>
      <p className="text-sm text-gray-700">
        Anda dapat meminta penghapusan akun dan data Anda kapan saja dengan menghubungi email ramdan.personal@gmail.com. Lampirkan informasi seperti link channel, username, nama channel.
      </p>
      <p className="text-xs text-gray-500 mt-6">Terakhir diperbarui: {new Date().toLocaleDateString()}</p>
    </div>
  );
}
