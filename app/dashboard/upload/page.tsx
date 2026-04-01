"use client";

import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [bankId, setBankId] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Upload extras bancar</h2>
        <p className="text-gray-500 mt-1">Importă tranzacții din fișier CSV sau Excel</p>
      </div>

      {/* Banner Coming Soon */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 flex items-start gap-3">
        <span className="text-2xl">🚧</span>
        <div>
          <p className="font-semibold text-amber-800">Upload va fi funcțional în Săptămâna 5, Lecția 5.1</p>
          <p className="text-sm text-amber-600 mt-0.5">Deocamdată poți adăuga tranzacții manual din pagina Tranzacții.</p>
        </div>
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
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {file ? (
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
          </select>
          <p className="text-xs text-gray-400 mt-1">Adaugă bănci din pagina <a href="/dashboard/banks" className="text-teal-600 underline">Bănci</a>.</p>
        </div>

        {/* Buton Upload */}
        <button
          disabled
          className="w-full bg-teal-600 opacity-50 cursor-not-allowed text-white font-semibold rounded-xl py-3 transition-colors"
        >
          📤 Upload și procesează
        </button>
      </div>

      {/* Preview table — gol */}
      <div className="mt-8 bg-white/40 backdrop-blur-md rounded-2xl shadow-lg border border-white/60 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Preview tranzacții</h3>
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium">Niciun fișier procesat</p>
          <p className="text-sm mt-1">Tranzacțiile detectate vor apărea aici înainte de import</p>
        </div>
      </div>
    </div>
  );
}
