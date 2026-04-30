"use client";

import { useState, useEffect } from "react";
import { parseCSV, parseExcel, ParsedTransaction } from "@/lib/utils/file-parser";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [bankId, setBankId] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; categorized: number } | null>(null);
  const [banks, setBanks] = useState<{ id: string; name: string }[]>([]);
  const [inputKey, setInputKey] = useState(0);

  useEffect(() => {
    fetch("/api/banks", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setBanks(data.banks ?? []))
      .catch(() => {});
  }, []);

  const parseFile = async (selectedFile: File) => {
    setLoading(true);
    setParseError(null);
    setParsedTransactions([]);

    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    let result;

    if (ext === "csv") {
      result = await parseCSV(selectedFile);
    } else if (ext === "xlsx" || ext === "xls") {
      result = await parseExcel(selectedFile);
    } else {
      setParseError("Format nesupportat. Folosește CSV sau Excel (.xlsx, .xls).");
      setLoading(false);
      return;
    }

    if (!result.success) {
      setParseError(result.error ?? "Eroare necunoscută la citirea fișierului.");
    } else {
      setParsedTransactions(result.transactions);
    }

    setLoading(false);
  };

  const handleFileSelect = (selected: File | null) => {
    setFile(selected);
    if (selected) parseFile(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  };

  const handleImport = async () => {
    setImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const res = await fetch("/api/transactions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          bankId,
          transactions: parsedTransactions,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setImportError(data.error ?? "Eroare la import.");
      } else {
        setImportResult({ imported: data.imported, categorized: data.categorized });
        setParsedTransactions([]);
        setFile(null);
      }
    } catch {
      setImportError("Eroare de rețea. Verifică conexiunea și încearcă din nou.");
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedTransactions([]);
    setParseError(null);
    setImportResult(null);
    setImportError(null);
    setInputKey((k) => k + 1);
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Upload extras bancar</h2>
        <p className="text-gray-500 mt-1">Importă tranzacții din fișier CSV sau Excel</p>
      </div>

      {/* Form */}
      <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-lg border border-white/60 p-6 space-y-6">

        {/* File input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Fișier CSV sau Excel</label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-colors ${
              dragOver
                ? "border-teal-400 bg-teal-50"
                : file
                ? "border-teal-300 bg-teal-50/40"
                : "border-gray-200 hover:border-teal-300 hover:bg-teal-50/20"
            }`}
          >
            <input
              key={inputKey}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {loading ? (
              <div>
                <p className="text-3xl mb-2 animate-spin inline-block">⏳</p>
                <p className="font-semibold text-teal-700">Se procesează fișierul...</p>
                <p className="text-xs text-gray-400 mt-1">{file?.name}</p>
              </div>
            ) : file ? (
              <div>
                <p className="text-3xl mb-2">📄</p>
                <p className="font-semibold text-teal-700">{file.name}</p>
                <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                <p className="text-xs text-teal-500 mt-2">Click pentru a schimba fișierul</p>
              </div>
            ) : (
              <div>
                <p className="text-4xl mb-3">📤</p>
                <p className="font-medium text-gray-600">Trage fișierul aici sau <span className="text-teal-600 underline">navighează</span></p>
                <p className="text-xs text-gray-400 mt-1">CSV, XLS, XLSX — max 10MB</p>
              </div>
            )}
          </div>

          {/* Eroare parsare */}
          {parseError && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
              <span className="text-red-500 mt-0.5">✗</span>
              <p className="text-sm text-red-700">{parseError}</p>
            </div>
          )}
        </div>

        {/* Dropdown bancă */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Bancă sursă</label>
          <select
            value={bankId}
            onChange={(e) => setBankId(e.target.value)}
            className="w-full bg-white/60 border border-teal-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            <option value="">— Selectează banca —</option>
            {banks.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">Adaugă bănci din pagina <a href="/dashboard/banks" className="text-teal-600 underline">Bănci</a>.</p>
        </div>

        {/* Eroare import */}
        {importError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
            <span className="text-red-500 mt-0.5">✗</span>
            <p className="text-sm text-red-700">{importError}</p>
          </div>
        )}

        {/* Succes import */}
        {importResult && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-4 space-y-3">
            <p className="text-green-800 font-semibold">
              ✓ {importResult.imported} tranzacții importate, {importResult.categorized} categorizate automat
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 border border-teal-300 text-teal-700 font-semibold rounded-xl py-2 text-sm hover:bg-teal-50 transition-colors cursor-pointer"
              >
                Încarcă alt fișier
              </button>
              <a
                href="/dashboard/transactions"
                className="flex-1 bg-teal-600 text-white font-semibold rounded-xl py-2 text-sm text-center hover:bg-teal-700 transition-colors"
              >
                Vezi tranzacțiile
              </a>
            </div>
          </div>
        )}

        {/* Buton Import */}
        {!importResult && (
          <button
            onClick={handleImport}
            disabled={parsedTransactions.length === 0 || loading || importing || !bankId}
            title={!bankId && parsedTransactions.length > 0 ? "Selectează o bancă pentru a importa" : undefined}
            className="w-full bg-teal-600 text-white font-semibold rounded-xl py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-700 enabled:cursor-pointer"
          >
            {importing
              ? "Se importă..."
              : `📤 Importă ${parsedTransactions.length > 0 ? `${parsedTransactions.length} tranzacții` : "tranzacții"}`}
          </button>
        )}
      </div>

      {/* Preview table */}
      <div className="mt-8 bg-white/40 backdrop-blur-md rounded-2xl shadow-lg border border-white/60 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">
          Preview tranzacții
          {parsedTransactions.length > 0 && (
            <span className="ml-2 text-sm font-normal text-teal-600">
              {parsedTransactions.length} detectate
            </span>
          )}
        </h3>

        {parsedTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-2 pr-4 font-semibold">Dată</th>
                  <th className="pb-2 pr-4 font-semibold">Descriere</th>
                  <th className="pb-2 pr-4 font-semibold text-right">Sumă</th>
                  <th className="pb-2 font-semibold">Valută</th>
                </tr>
              </thead>
              <tbody>
                {parsedTransactions.slice(0, 10).map((t, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">{t.date}</td>
                    <td className="py-2 pr-4 text-gray-800 max-w-xs truncate">{t.description}</td>
                    <td className={`py-2 pr-4 text-right font-medium whitespace-nowrap ${t.amount < 0 ? "text-red-600" : "text-green-600"}`}>
                      {t.amount > 0 ? "+" : ""}{t.amount.toFixed(2)}
                    </td>
                    <td className="py-2 text-gray-500">{t.currency ?? "RON"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedTransactions.length > 10 && (
              <p className="text-xs text-gray-400 text-center mt-3">
                ...și încă {parsedTransactions.length - 10} tranzacții
              </p>
            )}
            <p className="text-sm text-gray-600 font-medium mt-4 pt-4 border-t border-gray-100">
              Total: {parsedTransactions.length} tranzacții găsite în fișier
            </p>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium">Niciun fișier procesat</p>
            <p className="text-sm mt-1">Tranzacțiile detectate vor apărea aici înainte de import</p>
          </div>
        )}
      </div>
    </div>
  );
}
