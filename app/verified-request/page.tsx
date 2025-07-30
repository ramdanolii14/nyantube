export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto mt-20 p-5 bg-white shadow-md rounded-md">
      <h1 className="text-2xl font-bold mb-4">Verified Badge Request</h1>
      <p className="text-sm text-gray-600 mb-4">
        <strong>Nyantube</strong> Menyediakan Verified Badge untuk creator manapun yang meng email ke kami. Informasi contact dibawah ini.
      </p>

      <h2 className="text-lg font-semibold mt-4">Email</h2>
      <p className="text-sm text-gray-700">
        dev@ramdan.fun
      </p>

      <p className="text-xs text-gray-500 mt-6">Terakhir diperbarui: {new Date().toLocaleDateString()}</p>
    </div>
  );
}
