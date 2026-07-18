import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

/**
 * Rulat zilnic de Vercel Cron (vezi vercel.json). Face un query real pe DB
 * ca să țină proiectul Supabase (plan gratuit) activ — Supabase pune automat
 * pe pauză proiectele fără activitate ~7 zile, ceea ce a blocat login-ul
 * real al utilizatorului pe 2026-07-18.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db.select({ id: schema.users.id }).from(schema.users).limit(1);
    return NextResponse.json({ ok: true, checkedAt: new Date().toISOString() });
  } catch (error) {
    console.error("[CRON keep-alive] Error:", error);
    return NextResponse.json({ error: "Eroare internă server" }, { status: 500 });
  }
}
