import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function verifyCategoryOwnership(
  categoryId: string | null | undefined,
  userId: string
): Promise<boolean> {
  if (!categoryId) return true;
  const [category] = await db
    .select({ id: schema.categories.id })
    .from(schema.categories)
    .where(and(eq(schema.categories.id, categoryId), eq(schema.categories.userId, userId)))
    .limit(1);
  return !!category;
}

export async function verifyBankOwnership(
  bankId: string | null | undefined,
  userId: string
): Promise<boolean> {
  if (!bankId) return true;
  const [bank] = await db
    .select({ id: schema.banks.id })
    .from(schema.banks)
    .where(and(eq(schema.banks.id, bankId), eq(schema.banks.userId, userId)))
    .limit(1);
  return !!bank;
}
