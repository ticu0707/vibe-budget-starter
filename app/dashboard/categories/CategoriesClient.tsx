"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Category } from "@/lib/db/schema";

const EMOJI_LIST = [
  "💰", "🏠", "🚗", "🍔", "👕", "✈️", "🎬", "💊", "📚", "🎮",
  "💳", "🏦", "💵", "📈", "🎁", "🏥", "⚡", "📱", "🛒", "🐾",
  "🍕", "☕", "🎵", "🏋️", "🌿", "🧴", "🏫", "🚌", "🔧", "🎯",
];

interface Props {
  initialCategories: Category[];
}

interface FormState {
  name: string;
  type: "income" | "expense";
  icon: string;
}

export default function CategoriesClient({ initialCategories }: Props) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [form, setForm] = useState<FormState>({ name: "", type: "expense", icon: "📁" });

  const income = categories.filter((c) => c.type === "income");
  const expense = categories.filter((c) => c.type === "expense");

  const fetchCategories = async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    if (res.ok) setCategories(data.categories);
  };

  const openAdd = (type: "income" | "expense") => {
    setEditingId(null);
    setForm({ name: "", type, icon: "📁" });
    setShowForm(true);
    setShowPicker(false);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, type: cat.type as "income" | "expense", icon: cat.icon || "📁" });
    setShowForm(true);
    setShowPicker(false);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setShowPicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingId ? `/api/categories/${editingId}` : "/api/categories";
      const method = editingId ? "PUT" : "POST";
      const body = editingId
        ? { name: form.name, icon: form.icon }
        : { name: form.name, type: form.type, icon: form.icon };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Eroare la salvare");
        return;
      }

      toast.success(editingId ? "Categorie actualizată!" : "Categorie adăugată!");
      await fetchCategories();
      cancelForm();
    } catch {
      toast.error("Eroare de rețea");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(`Ștergi categoria "${cat.name}"?`)) return;

    try {
      const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Eroare la ștergere");
        return;
      }

      toast.success("Categorie ștearsă!");
      await fetchCategories();
    } catch {
      toast.error("Eroare de rețea");
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Categorii</h2>
        <p className="text-gray-500 mt-1">Gestionează categoriile de tranzacții</p>
      </div>

      {/* Formular inline */}
      {showForm && (
        <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-lg border border-white/60 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? "Editează categorie" : `Adaugă categorie ${form.type === "income" ? "venit" : "cheltuială"}`}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              {/* Icon selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <button
                  type="button"
                  onClick={() => setShowPicker(!showPicker)}
                  className="w-14 h-12 text-2xl bg-white/60 border border-teal-200 rounded-xl flex items-center justify-center hover:bg-white/80 transition-colors"
                >
                  {form.icon}
                </button>
              </div>

              {/* Nume */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nume categorie</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Salariu, Chirie, Mâncare"
                  className="w-full bg-white/60 border border-teal-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                />
              </div>

              {/* Tip (disabled la editare) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tip</label>
                <select
                  value={form.type}
                  disabled={!!editingId}
                  onChange={(e) => setForm({ ...form, type: e.target.value as "income" | "expense" })}
                  className="bg-white/60 border border-teal-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-60"
                >
                  <option value="income">Venit</option>
                  <option value="expense">Cheltuială</option>
                </select>
              </div>
            </div>

            {/* Icon picker grid */}
            {showPicker && (
              <div className="bg-white/80 rounded-xl p-3 border border-teal-100">
                <div className="grid grid-cols-10 gap-1">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => { setForm({ ...form, icon: emoji }); setShowPicker(false); }}
                      className={`text-2xl p-1 rounded-lg hover:bg-teal-50 transition-colors ${form.icon === emoji ? "bg-teal-100" : ""}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold rounded-xl px-5 py-2.5 transition-colors"
              >
                {loading ? "..." : "Salvează"}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="bg-white/60 hover:bg-white/80 text-gray-600 font-semibold rounded-xl px-5 py-2.5 transition-colors border border-gray-200"
              >
                Anulează
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabel Venituri */}
        <CategoryTable
          title="Venituri"
          icon="📈"
          headerColor="text-green-700"
          categories={income}
          onAdd={() => openAdd("income")}
          onEdit={openEdit}
          onDelete={handleDelete}
          addButtonClass="bg-green-500 hover:bg-green-600"
        />

        {/* Tabel Cheltuieli */}
        <CategoryTable
          title="Cheltuieli"
          icon="📉"
          headerColor="text-red-600"
          categories={expense}
          onAdd={() => openAdd("expense")}
          onEdit={openEdit}
          onDelete={handleDelete}
          addButtonClass="bg-orange-500 hover:bg-orange-600"
        />
      </div>
    </div>
  );
}

function CategoryTable({
  title, icon, headerColor, categories, onAdd, onEdit, onDelete, addButtonClass,
}: {
  title: string;
  icon: string;
  headerColor: string;
  categories: Category[];
  onAdd: () => void;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  addButtonClass: string;
}) {
  return (
    <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-lg border border-white/60 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-bold flex items-center gap-2 ${headerColor}`}>
          <span>{icon}</span> {title}
        </h3>
        <button
          onClick={onAdd}
          className={`${addButtonClass} text-white text-sm font-semibold rounded-xl px-4 py-2 transition-colors`}
        >
          + Adaugă
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-sm">Nicio categorie încă</p>
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-400 pb-2 w-10">Icon</th>
              <th className="text-left text-xs font-medium text-gray-400 pb-2">Nume</th>
              <th className="text-right text-xs font-medium text-gray-400 pb-2">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-white/30 transition-colors">
                <td className="py-2.5 text-xl">{cat.icon}</td>
                <td className="py-2.5">
                  <span className="font-medium text-gray-800 text-sm">{cat.name}</span>
                  {cat.isSystemCategory && (
                    <span className="ml-2 bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                      Sistem
                    </span>
                  )}
                </td>
                <td className="py-2.5 text-right space-x-3">
                  <button
                    onClick={() => onEdit(cat)}
                    className="text-teal-600 hover:text-teal-700 text-xs font-medium"
                  >
                    Editează
                  </button>
                  {!cat.isSystemCategory && (
                    <button
                      onClick={() => onDelete(cat)}
                      className="text-red-500 hover:text-red-600 text-xs font-medium"
                    >
                      Șterge
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
