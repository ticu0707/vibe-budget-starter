"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Deconectat cu succes");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Eroare la deconectare");
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
    >
      <span className="text-lg">🚪</span>
      <span className="font-medium">Deconectare</span>
    </button>
  );
}
