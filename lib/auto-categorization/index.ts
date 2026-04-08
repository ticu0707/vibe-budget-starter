import { UserKeyword } from "@/lib/db/schema";

export function autoCategorize(
  description: string,
  userKeywords: UserKeyword[]
): string | null {
  const descLower = description.toLowerCase();
  for (const kw of userKeywords) {
    if (descLower.includes(kw.keyword.toLowerCase())) {
      return kw.categoryId;
    }
  }
  return null;
}
