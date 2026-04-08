"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { Transaction, Bank, Category, Currency } from "@/lib/db/schema";

const PAGE_SIZE = 10;

interface Props {
  initialTransactions: Transaction[];
  banks: Bank[];
  categories: Category[];
  currencies: Currency[];
}

interface Filters {
  search: string;
  type: "" | "income" | "expense";
  bankId: string;
  categoryId: string;
  currency: string;
  dateFrom: string;
  dateTo: string;
}

interface FormState {
  date: string;
  description: string;
  amount: string;
  currency: string;
  bankId: string;
  categoryId: string;
}

const emptyForm = (): FormState => ({
  date: new Date().toISOString().split("T")[0],
  description: "",
  amount: "",
  currency: "RON",
  bankId: "",
  categoryId: "",
});

function formatAmount(amount: number) {
  return new Intl.NumberFormat("ro-RO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
}

export default function TransactionsClient({
  initialTransactions,
  banks,
  categories,
  currencies,
}: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    type: "",
    bankId: "",
    categoryId: "",
    currency: "",
    dateFrom: "",
    dateTo: "",
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [originalCategoryId, setOriginalCategoryId] = useState<string | null>(null);

  const hasFilters = Object.values(filters).some((v) => v !== "");

  const fetchTransactions = useCallback(async (f: Filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.search) params.set("search", f.search);
      if (f.type) params.set("type", f.type);
      if (f.bankId) params.set("bankId", f.bankId);
      if (f.categoryId) params.set("categoryId", f.categoryId);
      if (f.currency) params.set("currency", f.currency);
      if (f.dateFrom) params.set("dateFrom", f.dateFrom);
      if (f.dateTo) params.set("dateTo", f.dateTo);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setTransactions(data.transactions);
        setPage(1);
      }
    } catch {
      toast.error("Eroare la încărcare");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions(filters);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters, fetchTransactions]);

  const resetFilters = () => {
    setFilters({ search: "", type: "", bankId: "", categoryId: "", currency: "", dateFrom: "", dateTo: "" });
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEdit = (t: Transaction) => {
    setEditingId(t.id);
    setOriginalCategoryId(t.categoryId ?? null);
    setForm({
      date: t.date,
      description: t.description,
      amount: String(t.amount),
      currency: t.currency,
      bankId: t.bankId ?? "",
      categoryId: t.categoryId ?? "",
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        date: form.date,
        description: form.description,
        amount: Number(form.amount),
        currency: form.currency,
        bankId: form.bankId || null,
        categoryId: form.categoryId || null,
      };

      const url = editingId ? `/api/transactions/${editingId}` : "/api/transactions";
      const method = editingId ? "PUT" : "POST";

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

      // Salvare automată keyword dacă s-a atribuit o categorie nouă
      const categoryChanged = form.categoryId && form.categoryId !== originalCategoryId;
      if (categoryChanged) {
        const keyword = extractKeyword(form.description);
        if (keyword) {
          const kwRes = await fetch("/api/keywords", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ keyword, categoryId: form.categoryId }),
          });
          if (kwRes.ok) {
            const kwData = await kwRes.json();
            if (kwData.saved) {
              const catName = categories.find((c) => c.id === form.categoryId)?.name ?? "";
              toast.success(`Keyword "${keyword}" salvat → ${catName}`);
            }
          }
        }
      }

      toast.success(editingId ? "Tranzacție actualizată!" : "Tranzacție adăugată!");
      setShowModal(false);
      await fetchTransactions(filters);
    } catch {
      toast.error("Eroare de rețea");
    } finally {
      setSaving(false);
    }
  };

  function extractKeyword(description: string): string | null {
    // Elimină prefixele comune din extrasele bancare românești
    let cleaned = description
      .replace(/^Card:\d+\s+[X\d ]+\s+/i, "")        // "Card:4243 XXXX XXXX 7559 "
      .replace(/^POS comerciant\s+[\d.,]+\s+\w+\s+[\d-]+\s+/i, "") // "POS comerciant 36.47 RON 21-02-2026 "
      .replace(/^MOBILE-/i, "")
      .replace(/^Plata\s+/i, "")
      .replace(/^Retragere\s+numerar\s+ATM\s+/i, "ATM ")
      .replace(/Curs\*.*$/i, "")                       // elimină "Curs* calculat:..."
      .replace(/IBAN\s+Platitor:.*/i, "")               // elimină IBAN info
      .replace(/Platitor:.*/i, "")
      .trim();

    // Ia primul cuvânt util (min 3 caractere, nu doar cifre)
    const words = cleaned.split(/[\s,./\\|]+/);
    const keyword = words.find((w) => w.length >= 3 && !/^\d+$/.test(w));
    return keyword ? keyword.toLowerCase() : null;
  }

  const handleDelete = async (t: Transaction) => {
    if (!window.confirm(`Ștergi tranzacția "${t.description}"?`)) return;
    try {
      const res = await fetch(`/api/transactions/${t.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Tranzacție ștearsă!");
        await fetchTransactions(filters);
      }
    } catch {
      toast.error("Eroare de rețea");
    }
  };

  // Paginare
  const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
  const paginated = transactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const bankMap = Object.fromEntries(banks.map((b) => [b.id, b]));
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tranzacții</h2>
          <p className="text-gray-500 mt-1">
            {transactions.length} tranzacții{hasFilters ? " (filtrate)" : ""}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl px-5 py-2.5 transition-colors"
        >
          + Adaugă tranzacție
        </button>
      </div>

      {/* Filtre */}
      <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 p-4 mb-6 shadow">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-48">
            <input
              type="text"
              placeholder="Caută descriere..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full bg-white/60 border border-teal-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          {/* Tip */}
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value as Filters["type"] })}
            className="bg-white/60 border border-teal-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            <option value="">Toate tipurile</option>
            <option value="income">Venituri</option>
            <option value="expense">Cheltuieli</option>
          </select>

          {/* Bancă */}
          {banks.length > 0 && (
            <select
              value={filters.bankId}
              onChange={(e) => setFilters({ ...filters, bankId: e.target.value })}
              className="bg-white/60 border border-teal-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="">Toate băncile</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}

          {/* Categorie */}
          {categories.length > 0 && (
            <select
              value={filters.categoryId}
              onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
              className="bg-white/60 border border-teal-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="">Toate categoriile</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          )}

          {/* Valută */}
          {currencies.length > 0 && (
            <select
              value={filters.currency}
              onChange={(e) => setFilters({ ...filters, currency: e.target.value })}
              className="bg-white/60 border border-teal-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="">Toate valutele</option>
              {currencies.map((c) => (
                <option key={c.id} value={c.code}>{c.code}</option>
              ))}
            </select>
          )}

          {/* Date range */}
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            className="bg-white/60 border border-teal-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            className="bg-white/60 border border-teal-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
          />

          {/* Reset */}
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-xl px-4 py-2.5 transition-colors"
            >
              ✕ Resetează
            </button>
          )}
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-lg border border-white/60 p-6">
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-2xl mb-2">⏳</p>
            <p className="text-sm">Se încarcă...</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-medium">Nicio tranzacție{hasFilters ? " pentru filtrele selectate" : ""}</p>
            {!hasFilters && (
              <p className="text-sm mt-1">Adaugă prima tranzacție folosind butonul de sus</p>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 pb-3 uppercase tracking-wide">Data</th>
                    <th className="text-left text-xs font-semibold text-gray-500 pb-3 uppercase tracking-wide">Descriere</th>
                    <th className="text-right text-xs font-semibold text-gray-500 pb-3 uppercase tracking-wide">Sumă</th>
                    <th className="text-left text-xs font-semibold text-gray-500 pb-3 uppercase tracking-wide pl-3">Bancă</th>
                    <th className="text-left text-xs font-semibold text-gray-500 pb-3 uppercase tracking-wide">Categorie</th>
                    <th className="text-right text-xs font-semibold text-gray-500 pb-3 uppercase tracking-wide">Acțiuni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map((t) => {
                    const bank = t.bankId ? bankMap[t.bankId] : null;
                    const category = t.categoryId ? categoryMap[t.categoryId] : null;
                    const isPositive = Number(t.amount) >= 0;

                    return (
                      <tr key={t.id} className="hover:bg-white/30 transition-colors">
                        <td className="py-3 text-sm text-gray-500 whitespace-nowrap pr-4">{t.date}</td>
                        <td className="py-3 text-sm text-gray-800 max-w-xs">
                          <p className="truncate font-medium">{t.description}</p>
                        </td>
                        <td className="py-3 text-right whitespace-nowrap">
                          <span className={`font-semibold text-sm ${isPositive ? "text-green-600" : "text-red-500"}`}>
                            {isPositive ? "+" : "-"}{formatAmount(Number(t.amount))} {t.currency}
                          </span>
                        </td>
                        <td className="py-3 pl-3">
                          {bank ? (
                            <span
                              className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: bank.color ?? "#6366f1" }}
                            >
                              {bank.name}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="py-3 text-sm text-gray-600">
                          {category ? (
                            <span>{category.icon} {category.name}</span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => openEdit(t)}
                              className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                            >
                              Editează
                            </button>
                            <button
                              onClick={() => handleDelete(t)}
                              className="text-red-500 hover:text-red-600 text-sm font-medium"
                            >
                              Șterge
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginare */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Pagina {page} din {totalPages} ({transactions.length} total)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 bg-white/60 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 bg-white/60 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Următor →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal adaugă / editează */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-5">
              {editingId ? "Editează tranzacție" : "Adaugă tranzacție"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Dată + Sumă */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sumă <span className="text-gray-400 font-normal">(neg. = cheltuială)</span>
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="-45.50"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>

              {/* Descriere */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descriere</label>
                <input
                  type="text"
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="ex: MEGA IMAGE 123"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              {/* Valută + Bancă */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valută</label>
                  {currencies.length > 0 ? (
                    <select
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    >
                      {currencies.map((c) => (
                        <option key={c.id} value={c.code}>{c.code} {c.symbol}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      maxLength={5}
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
                      placeholder="RON"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bancă (opțional)</label>
                  <select
                    value={form.bankId}
                    onChange={(e) => setForm({ ...form, bankId: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  >
                    <option value="">— Fără bancă —</option>
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Categorie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categorie (opțional)</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="">— Fără categorie —</option>
                  <optgroup label="Venituri">
                    {categories.filter((c) => c.type === "income").map((c) => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Cheltuieli">
                    {categories.filter((c) => c.type === "expense").map((c) => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Butoane */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 transition-colors"
                >
                  {saving ? "Se salvează..." : editingId ? "Salvează" : "Adaugă"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl py-2.5 transition-colors"
                >
                  Anulează
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
