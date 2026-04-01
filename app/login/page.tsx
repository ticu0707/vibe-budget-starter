"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Eroare la autentificare");
        return;
      }

      toast.success("Bine ai revenit!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Eroare de rețea. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-orange-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">💰 Vibe Budget</h1>
          <p className="text-gray-500 mt-2">Gestiunea ta financiară personală</p>
        </div>

        {/* Card glassmorphism */}
        <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-lg border border-white/60 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Intră în cont</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@exemplu.com"
                className="w-full bg-white/60 border border-teal-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parolă
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-white/60 border border-teal-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold rounded-xl px-6 py-3 transition-colors mt-2"
            >
              {loading ? "Se procesează..." : "Intră în cont"}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Nu ai cont?{" "}
            <Link href="/register" className="text-teal-600 hover:text-teal-700 font-semibold">
              Înregistrează-te
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
