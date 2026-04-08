/**
 * Categorii predefinite pentru auto-seed la primul acces.
 * Funcția getAIICategories() returnează lista completă cu
 * toate cele 12 categorii de sistem.
 */

export interface SystemCategory {
  name: string;
  type: "income" | "expense";
  icon: string;
  description: string;
}

export function getAIICategories(): SystemCategory[] {
  return [
    // ── Cheltuieli (9) ──────────────────────────────────────────────
    {
      name: "Transport",
      type: "expense",
      icon: "🚗",
      description: "Benzină, taxi, metrou, parcări, autobuz, Uber",
    },
    {
      name: "Cumpărături",
      type: "expense",
      icon: "🛒",
      description: "Supermarket, haine, electronice, online shopping",
    },
    {
      name: "Locuință",
      type: "expense",
      icon: "🏠",
      description: "Chirie, utilități, întreținere, reparații",
    },
    {
      name: "Sănătate",
      type: "expense",
      icon: "💊",
      description: "Medicamente, consultații, analize, stomatolog",
    },
    {
      name: "Divertisment",
      type: "expense",
      icon: "🎬",
      description: "Restaurante, cinema, concerte, sport, hobby",
    },
    {
      name: "Subscripții",
      type: "expense",
      icon: "📱",
      description: "Netflix, Spotify, telefon, internet, abonamente",
    },
    {
      name: "Educație",
      type: "expense",
      icon: "📚",
      description: "Cursuri, cărți, tutoriale, școlarizare",
    },
    {
      name: "Cash",
      type: "expense",
      icon: "💵",
      description: "Retrageri numerar ATM",
    },
    {
      name: "Taxe și Impozite",
      type: "expense",
      icon: "🏛️",
      description: "Impozite, taxe, amenzi, contribuții",
    },
    {
      name: "Economii",
      type: "expense",
      icon: "🏦",
      description: "Depozite, fond de urgență, economii lunare",
    },
    // ── Venituri (1) ────────────────────────────────────────────────
    {
      name: "Venituri",
      type: "income",
      icon: "💰",
      description: "Salariu, freelancing, dividende, alte venituri",
    },
    // ── Transferuri (2) ─────────────────────────────────────────────
    {
      name: "Transfer Intern",
      type: "expense",
      icon: "🔄",
      description: "Transfer între conturile proprii",
    },
    {
      name: "Transferuri",
      type: "expense",
      icon: "↔️",
      description: "Transferuri către/de la alte persoane",
    },
  ];
}
