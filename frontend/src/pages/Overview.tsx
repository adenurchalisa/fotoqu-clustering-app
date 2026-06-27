import { Link } from "react-router-dom";

export default function Overview() {
  return (
    <div className="grid md:grid-cols-2 gap-10 items-center py-8">
      <div>
        <h1 className="font-serif text-5xl leading-tight text-ink">
          Your photos,
          <br />
          sorted by face.
        </h1>
        <p className="mt-5 max-w-md text-muted leading-relaxed">
          Drop a mixed folder of thousands of photos. FotoQu mengelompokkan setiap gambar
          berdasarkan orang di dalamnya — otomatis, pakai pengenalan wajah.
        </p>
        <Link
          to="/upload"
          className="inline-block mt-7 rounded-full bg-ink px-6 py-3 text-cream font-semibold hover:opacity-90 transition"
        >
          Mulai sekarang →
        </Link>
      </div>
      <div className="rounded-3xl border border-sandborder bg-sand p-8">
        <ol className="space-y-4">
          {[
            ["1", "Upload foto / ZIP atau tempel link Google Drive"],
            ["2", "FotoQu mendeteksi wajah & mengelompokkan otomatis"],
            ["3", "Unduh hasil per orang sebagai folder ZIP"],
          ].map(([n, t]) => (
            <li key={n} className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-cream text-sm font-bold">
                {n}
              </span>
              <span className="text-ink">{t}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
