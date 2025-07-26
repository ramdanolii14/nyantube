export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto mt-20 p-5 bg-white shadow-md rounded-md">
      <h1 className="text-2xl font-bold mb-4">Tentang Nyantube</h1>
      <p className="text-sm text-gray-600 mb-4">
        <strong>Nyantube</strong> adalah platform berbagi video yang dibuat untuk kreator lokal dan penikmat konten kreatif.
        Kami berkomitmen untuk menyediakan ruang yang aman, adil, dan menyenangkan untuk semua orang.
      </p>

      <h2 className="text-lg font-semibold mt-4">Misi Kami</h2>
      <p className="text-sm text-gray-700">
        Membangun komunitas kreator yang positif, mendukung karya orisinal, dan mengutamakan kebebasan berekspresi
        tanpa melanggar hukum yang berlaku.
      </p>

      <h2 className="text-lg font-semibold mt-4">Siapa Kami?</h2>
      <p className="text-sm text-gray-700">
        Platform ini dikembangkan oleh tim kecil yang peduli pada dunia kreatif digital. Kami menghargai setiap
        kreator dan berusaha terus mengembangkan fitur yang berguna bagi Anda.
      </p>

      <h2 className="text-lg font-semibold mt-4">Legalitas</h2>
      <p className="text-sm text-gray-700">
        Nyantube beroperasi sesuai hukum yang berlaku dan mematuhi ketentuan hak cipta, privasi, serta perlindungan konsumen.
      </p>

      <h2 className="text-lg font-semibold mt-4">Verified Badge</h2>
      <p className="text-sm text-gray-700">
        Untuk Request Verified badge bisa chat +62 857-9618-2078. Dan Lampirkan informasi seperti username dan email kamu. Setelah dikonfirmasi, maka kamu akan langsung mendapatkan verified badge.
      </p>

      <p className="text-xs text-gray-500 mt-6">Terakhir diperbarui: {new Date().toLocaleDateString()}</p>
    </div>
  );
}
