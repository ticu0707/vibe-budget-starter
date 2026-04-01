import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import BanksClient from "./BanksClient";

export default async function BanksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const banks = await db
    .select()
    .from(schema.banks)
    .where(eq(schema.banks.userId, user.id))
    .orderBy(schema.banks.createdAt);

  return <BanksClient initialBanks={banks} />;
}
