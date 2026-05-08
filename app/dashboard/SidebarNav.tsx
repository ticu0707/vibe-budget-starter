"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-4 space-y-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
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
  );
}
