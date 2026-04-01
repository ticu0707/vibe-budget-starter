import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const { id } = await params;
    const { name, color } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Numele băncii este obligatoriu" }, { status: 400 });
    }

    const [bank] = await db
      .update(schema.banks)
      .set({ name: name.trim(), color: color || "#6366f1" })
      .where(and(eq(schema.banks.id, id), eq(schema.banks.userId, user.id)))
      .returning();

    if (!bank) {
      return NextResponse.json({ error: "Banca nu a fost găsită" }, { status: 404 });
    }

    return NextResponse.json({ bank });
  } catch (error) {
    console.error("[BANKS PUT] Error:", error);
    return NextResponse.json({ error: "Eroare internă server" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const { id } = await params;

    const [bank] = await db
      .delete(schema.banks)
      .where(and(eq(schema.banks.id, id), eq(schema.banks.userId, user.id)))
      .returning();

    if (!bank) {
      return NextResponse.json({ error: "Banca nu a fost găsită" }, { status: 404 });
    }

    return NextResponse.json({ message: "Bancă ștearsă cu succes" });
  } catch (error) {
    console.error("[BANKS DELETE] Error:", error);
    return NextResponse.json({ error: "Eroare internă server" }, { status: 500 });
  }
}
