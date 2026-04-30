"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import type { Bank } from "@/lib/db/schema";

interface Props {
  initialBanks: Bank[];
}

interface FormState {
  name: string;
  color: string;
}

export default function BanksClient({ initialBanks }: Props) {
  const [banks, setBanks] = useState<Bank[]>(initialBanks);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>({ name: "", color: "#14b8a6" });
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const fetchBanks = async () => {
    const res = await fetch("/api/banks");
    const data = await res.json();
    if (res.ok) setBanks(data.banks);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: "", color: "#14b8a6" });
    setShowForm(true);
    scrollToForm();
  };

  const openEdit = (bank: Bank) => {
    setEditingId(bank.id);
    setForm({ name: bank.name, color: bank.color || "#14b8a6" });
    setShowForm(true);
    scrollToForm();
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: "", color: "#14b8a6" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingId ? `/api/banks/${editingId}` : "/api/banks";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Eroare la salvare");
        return;
      }

      toast.success(editingId ? "Bancă actualizată!" : "Bancă adăugată!");
      await fetchBanks();
      cancelForm();
    } catch {
      toast.error("Eroare de rețea");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bank: Bank) => {
    if (!window.confirm(`Ștergi banca "${bank.name}"?`)) return;

    try {
      const res = await fetch(`/api/banks/${bank.id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Eroare la ștergere");
        return;
      }

      toast.success("Bancă ștearsă!");
      await fetchBanks();
    } catch {
      toast.error("Eroare de rețea");
    }
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bănci</h2>
          <p className="text-gray-500 mt-1">Gestionează conturile bancare</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl px-5 py-2.5 transition-colors"
        >
          + Adaugă bancă
        </button>
      </div>

      {/* Formular inline */}
      {showForm && (
        <div ref={formRef} className="bg-white/40 backdrop-blur-md rounded-2xl shadow-lg border border-white/60 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? "Editează bancă" : "Adaugă bancă nouă"}
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nume bancă
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: ING, BCR, Revolut"
                className="w-full bg-white/60 border border-teal-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Culoare
              </label>
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-14 h-12 rounded-xl border border-teal-200 cursor-pointer p-1 bg-white/60"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold rounded-xl px-5 py-3 transition-colors"
              >
                {loading ? "..." : "Salvează"}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="bg-white/60 hover:bg-white/80 text-gray-600 font-semibold rounded-xl px-5 py-3 transition-colors border border-gray-200"
              >
                Anulează
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabel bănci */}
      <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-lg border border-white/60 p-6">
        {banks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">🏦</p>
            <p className="font-medium">Nicio bancă adăugată</p>
            <p className="text-sm mt-1">Adaugă prima ta bancă pentru a începe</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-sm font-medium text-gray-500 pb-3 w-16">Culoare</th>
                <th className="text-left text-sm font-medium text-gray-500 pb-3">Nume</th>
                <th className="text-right text-sm font-medium text-gray-500 pb-3">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {banks.map((bank) => (
                <tr key={bank.id} className="hover:bg-white/30 transition-colors">
                  <td className="py-3">
                    <span
                      className="w-6 h-6 rounded-full inline-block"
                      style={{ backgroundColor: bank.color || "#6366f1" }}
                    />
                  </td>
                  <td className="py-3 font-medium text-gray-800">{bank.name}</td>
                  <td className="py-3 text-right space-x-3">
                    <button
                      onClick={() => openEdit(bank)}
                      className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                    >
                      Editează
                    </button>
                    <button
                      onClick={() => handleDelete(bank)}
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
