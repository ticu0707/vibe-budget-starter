import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "./LogoutButton";
import MobileSidebar from "./MobileSidebar";
import SidebarNav from "./SidebarNav";

const TRIAL_DAYS = 7;

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

  const daysSince = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24);
  const isUnlocked = user.user_metadata?.unlocked === true;
  const trialExpired = daysSince > TRIAL_DAYS && !isUnlocked;

  if (trialExpired) {
    redirect("/trial-expirat");
  }

  const daysLeft = Math.max(0, Math.ceil(TRIAL_DAYS - daysSince));

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-orange-50 flex">
      {/* Sidebar desktop - ascuns pe mobile */}
      <aside className="hidden lg:flex w-64 bg-white/30 backdrop-blur-md border-r border-teal-100 flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-teal-100">
          <h1 className="text-xl font-bold text-gray-900">💰 Vibe Budget</h1>
          <p className="text-xs text-gray-500 mt-1 truncate">{user.email}</p>
        </div>

        {/* Navigare */}
        <SidebarNav />

        {/* Trial badge */}
        {!isUnlocked && (
          <div className="px-4 pb-2">
            <div className={`rounded-xl px-3 py-2 text-xs text-center font-medium ${
              daysLeft <= 1
                ? "bg-red-100 text-red-700"
                : daysLeft <= 3
                ? "bg-orange-100 text-orange-700"
                : "bg-teal-100 text-teal-700"
            }`}>
              {daysLeft <= 1
                ? "Ultima zi de trial"
                : `Trial: ${daysLeft} zile rămase`}
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="p-4 border-t border-teal-100">
          <LogoutButton />
        </div>
      </aside>

      {/* Zona principală */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header + drawer */}
        <MobileSidebar userEmail={user.email!} isUnlocked={isUnlocked} daysLeft={daysLeft} />

        {/* Continut principal */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
