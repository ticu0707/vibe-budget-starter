import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
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

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-orange-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white/30 backdrop-blur-md border-r border-teal-100 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-teal-100">
          <h1 className="text-xl font-bold text-gray-900">💰 Vibe Budget</h1>
          <p className="text-xs text-gray-500 mt-1 truncate">{user.email}</p>
        </div>

        {/* Navigare */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-teal-100/60 hover:text-teal-800 transition-colors"
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

      {/* Continut principal */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
