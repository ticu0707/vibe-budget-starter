"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Currency } from "@/lib/db/schema";

const PRESETS = [
  { code: "RON", name: "Romanian Leu", symbol: "lei" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "GBP", name: "British Pound", symbol: "£" },
];

interface Props {
  initialCurrencies: Currency[];
}

interface FormState {
  code: string;
  name: string;
  symbol: string;
}

export default function CurrenciesClient({ initialCurrencies }: Props) {
  const [currencies, setCurrencies] = useState<Currency[]>(initialCurrencies);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>({ code: "", name: "", symbol: "" });

  const fetchCurrencies = async () => {
    const res = await fetch("/api/currencies");
    const data = await res.json();
    if (res.ok) setCurrencies(data.currencies);
  };

  const addCurrency = async (body: FormState) => {
    setLoading(true);
    try {
      const res = await fetch("/api/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Eroare la adăugare");
        return false;
      }

      toast.success(`${body.code} adăugat!`);
      await fetchCurrencies();
      return true;
    } catch {
      toast.error("Eroare de rețea");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handlePreset = async (preset: typeof PRESETS[0]) => {
    const exists = currencies.some((c) => c.code === preset.code);
    if (exists) {
      toast.info(`${preset.code} există deja`);
      return;
    }
    await addCurrency(preset);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await addCurrency(form);
    if (ok) {
      setForm({ code: "", name: "", symbol: "" });
      setShowForm(false);
    }
  };

  const handleDelete = async (currency: Currency) => {
    if (!window.confirm(`Ștergi valuta ${currency.code}?`)) return;
    try {
      const res = await fetch("/api/currencies", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currency.id }),
      });
      if (res.ok) {
        toast.success("Valută ștearsă!");
        await fetchCurrencies();
      }
    } catch {
      toast.error("Eroare de rețea");
    }
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Valute</h2>
          <p className="text-gray-500 mt-1">Gestionează valutele folosite</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl px-5 py-2.5 transition-colors"
        >
          + Adaugă valută
        </button>
      </div>

      {/* Preset-uri rapide */}
      <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-lg border border-white/60 p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">Adaugă rapid</h3>
        <div className="flex gap-3 flex-wrap">
          {PRESETS.map((preset) => {
            const exists = currencies.some((c) => c.code === preset.code);
            return (
              <button
                key={preset.code}
                onClick={() => handlePreset(preset)}
                disabled={exists || loading}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-colors border ${
                  exists
                    ? "bg-gray-50 text-gray-400 border-gray-100 cursor-default"
                    : "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"
                }`}
              >
                <span className="text-lg">{preset.symbol}</span>
                <span>{preset.code}</span>
                {exists && <span className="text-xs text-gray-400">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Formular custom */}
      {showForm && (
        <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-lg border border-white/60 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Valută personalizată</h3>
          <form onSubmit={handleSubmit} className="flex gap-4 items-end flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cod (ex: CHF)</label>
              <input
                type="text"
                required
                maxLength={5}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="CHF"
                className="w-24 bg-white/60 border border-teal-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Simbol (ex: Fr)</label>
              <input
                type="text"
                required
                maxLength={5}
                value={form.symbol}
                onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                placeholder="Fr"
                className="w-24 bg-white/60 border border-teal-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div className="flex-1 min-w-40">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nume complet</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Swiss Franc"
                className="w-full bg-white/60 border border-teal-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold rounded-xl px-5 py-3 transition-colors"
              >
                {loading ? "..." : "Adaugă"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-white/60 hover:bg-white/80 text-gray-600 font-semibold rounded-xl px-5 py-3 transition-colors border border-gray-200"
              >
                Anulează
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabel valute */}
      <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-lg border border-white/60 p-6">
        {currencies.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">💱</p>
            <p className="font-medium">Nicio valută adăugată</p>
            <p className="text-sm mt-1">Folosește butoanele preset pentru a adăuga rapid RON, EUR, USD</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-sm font-medium text-gray-500 pb-3">Cod</th>
                <th className="text-left text-sm font-medium text-gray-500 pb-3">Simbol</th>
                <th className="text-left text-sm font-medium text-gray-500 pb-3">Nume</th>
                <th className="text-right text-sm font-medium text-gray-500 pb-3">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currencies.map((c) => (
                <tr key={c.id} className="hover:bg-white/30 transition-colors">
                  <td className="py-3 font-bold text-teal-700">{c.code}</td>
                  <td className="py-3 text-gray-600 font-medium">{c.symbol}</td>
                  <td className="py-3 text-gray-800">{c.name}</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleDelete(c)}
                      className="text-red-500 hover:text-red-600 text-sm font-medium"
                    >
                      Șterge
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
