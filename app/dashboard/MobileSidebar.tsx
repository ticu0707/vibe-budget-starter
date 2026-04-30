"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/dashboard/transactions", label: "Tranzacții", icon: "💳" },
  { href: "/dashboard/reports", label: "Rapoarte", icon: "📈" },
  { href: "/dashboard/categories", label: "Categorii", icon: "📁" },
  { href: "/dashboard/banks", label: "Bănci", icon: "🏦" },
  { href: "/dashboard/currencies", label: "Valute", icon: "💱" },
  { href: "/dashboard/upload", label: "Upload", icon: "📤" },
  { href: "/dashboard/ai-insights", label: "AI Insights", icon: "🤖" },
];

interface Props {
  userEmail: string;
}

export default function MobileSidebar({ userEmail }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white/30 backdrop-blur-md border-b border-teal-100">
        <h1 className="text-lg font-bold text-gray-900">💰 Vibe Budget</h1>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-xl hover:bg-teal-100/60 transition-colors"
          aria-label="Deschide meniu"
        >
          <span className="text-2xl">☰</span>
        </button>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white/90 backdrop-blur-md border-r border-teal-100 flex flex-col z-50 transition-transform duration-300 lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-teal-100 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">💰 Vibe Budget</h1>
            <p className="text-xs text-gray-500 mt-1 truncate max-w-[180px]">{userEmail}</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-xl hover:bg-teal-100/60 transition-colors text-gray-500"
            aria-label="Închide meniu"
          >
            ✕
          </button>
        </div>

        {/* Navigare */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                pathname === item.href
                  ? "bg-teal-100/80 text-teal-800 font-semibold"
                  : "text-gray-600 hover:bg-teal-100/60 hover:text-teal-800"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-teal-100">
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
