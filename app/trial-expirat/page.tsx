"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TrialExpiratPage() {
  const router = useRouter();
  const [parola, setParola] = useState("");
  const [loading, setLoading] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setEroare(null);

    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: parola }),
      });

      if (!res.ok) {
        const data = await res.json();
        setEroare(data.error ?? "Cod incorect. Încearcă din nou.");
        setParola("");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setEroare("Eroare de rețea. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-orange-500/20 border border-orange-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
            ⏰
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Perioada de trial a expirat</h1>
          <p className="text-slate-400 leading-relaxed">
            Cele 7 zile de acces gratuit s-au încheiat. Dacă ai primit un cod de acces,
            introdu-l mai jos pentru a continua.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl">
          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Cod de acces
              </label>
              <input
                type="text"
                required
                value={parola}
                onChange={(e) => { setParola(e.target.value); setEroare(null); }}
                placeholder="Introdu codul primit"
                autoFocus
                className={`w-full bg-white/10 border rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none transition-all ${
                  eroare
                    ? "border-red-400 focus:border-red-400"
                    : "border-white/20 focus:border-teal-400"
                }`}
              />
              {eroare && (
                <p className="text-red-400 text-sm mt-2">{eroare}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white font-semibold rounded-xl transition-all"
            >
              {loading ? "Se verifică..." : "Activează accesul"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-slate-500 text-sm mb-3">Nu ai un cod de acces?</p>
            <Link
              href="/"
              className="text-teal-400 hover:text-teal-300 text-sm font-medium transition-colors"
            >
              ← Înapoi la pagina principală
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
