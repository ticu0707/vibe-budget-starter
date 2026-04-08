import { UserKeyword } from "@/lib/db/schema";

// Reguli built-in pentru tranzacții românești
// Cheia = numele categoriei din DB, valoarea = lista de pattern-uri (lowercase)
export const BUILTIN_RULES: Record<string, string[]> = {
  "Locuință": [
    "hidroelectrica", "electrica", "enel", "eon gaz", "eon energie", "apa nova",
    "apa canal", "distrigaz", "engie", "innogy", "premier energy",
    "chirie", "intretinere", "asociatie proprietari", "bloc", "reparatii",
    "dedeman", "hornbach", "leroy merlin", "bricostore", "brico",
  ],
  "Subscripții": [
    "digi romania", "digi mobil", "orange", "vodafone", "telekom",
    "rcs", "rds", "upc", "netflix", "spotify", "hbo", "disney",
    "amazon prime", "youtube premium", "apple", "google play",
    "adobe", "microsoft", "antivirus",
  ],
  "Transport": [
    "petrom", "rompetrol", "mol ", "lukoil", "omv", "socar",
    "benzinarie", "carburant", "benzina", "motorina",
    "uber", "bolt", "taxi", "cabify",
    "ratb", "stb ", "metrorex", "metro ", "tram", "autobuz",
    "parcare", "parking", "rca ", "rovinieta", "drum",
    "dac air", "tarom", "ryanair", "wizzair", "wizz air", "blue air",
    "cfr", "autogara",
  ],
  "Sănătate": [
    "farmaci", "farmatec", "catena", "helpnet", "dr max",
    "plation*farmaci", "plati*farmaci",
    "doctor", "medic", "clinica", "spital", "policlinica",
    "stomatolog", "dentar", "dental", "optica", "lensa",
    "reginamaria", "medicover", "medlife", "synevo", "bioclinica",
    "laborator",
  ],
  "Cumpărături": [
    "mega image", "kaufland", "lidl", "carrefour", "auchan",
    "penny", "profi", "cora", "selgros", "metro cash", "la doi pasi",
    "emag", "altex", "media galaxy", "flanco", "domo",
    "h&m", "zara", "pull&bear", "mango", "reserved", "lcwaikiki",
    "ikea", "jysk", "mobexpert",
    "iulius", "shopping city", "sun plaza", "palace", "vivo",
  ],
  "Divertisment": [
    "restaurant", "bistro", "cafenea", "cafe ", "coffee", "starbucks",
    "mcdonalds", "kfc", "burger king", "subway", "taco bell",
    "pizza", "sushi", "delivery", "glovo", "tazz", "bolt food",
    "cinema", "cinemax", "multikino", "cinema city",
    "bowling", "escape room", "paintball", "karting",
    "bar ", "pub ", "club ", "discoteca",
    "complex statiune", "statiune", "hotel", "pensiune", "resort",
  ],
  "Cash": [
    "atm ", "retragere numerar", "retragere atm", "numerar",
    "withdraw", "cash advance",
  ],
  "Taxe și Impozite": [
    "impozit", "taxa ", "taxe ", "dgitl", "anaf", "ditl",
    "amenda", "amenzi", "statul roman", "primaria",
    "cas ", "cass ", "contributii", "asigurare", "rovinieta",
  ],
  "Educație": [
    "udemy", "coursera", "skillshare", "linkedin learning",
    "scoala", "gradinita", "liceu", "universitate", "facultate",
    "carte", "librarie", "humanitas",
    "taxa scolara", "cursuri",
  ],
  "Economii": [
    "economii", "depozit", "fond urgenta", "fond de urgenta",
    "transfer economii", "cont economii", "scop economii",
  ],
  "Venituri": [
    "incasare salariu", "salariu", "virament salariu",
    "dividend", "freelance", "onorariu",
  ],
};

export function autoCategorize(
  description: string,
  userKeywords: UserKeyword[],
  categoryNameToId?: Record<string, string>
): string | null {
  const descLower = description.toLowerCase();

  // 1. Prioritate: keyword-uri salvate de user
  for (const kw of userKeywords) {
    if (descLower.includes(kw.keyword.toLowerCase())) {
      return kw.categoryId;
    }
  }

  // 2. Reguli built-in (dacă avem mapping nume → id)
  if (categoryNameToId) {
    for (const [catName, patterns] of Object.entries(BUILTIN_RULES)) {
      const categoryId = categoryNameToId[catName];
      if (!categoryId) continue;
      for (const pattern of patterns) {
        if (descLower.includes(pattern)) {
          return categoryId;
        }
      }
    }
  }

  return null;
}
