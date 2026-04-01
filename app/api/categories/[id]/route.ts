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
    const { name, icon } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Numele categoriei este obligatoriu" }, { status: 400 });
    }

    const [category] = await db
      .update(schema.categories)
      .set({ name: name.trim(), icon: icon || "📁" })
      .where(and(eq(schema.categories.id, id), eq(schema.categories.userId, user.id)))
      .returning();

    if (!category) {
      return NextResponse.json({ error: "Categoria nu a fost găsită" }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error("[CATEGORIES PUT] Error:", error);
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

    // Verifică că există și aparține userului
    const existing = await db
      .select()
      .from(schema.categories)
      .where(and(eq(schema.categories.id, id), eq(schema.categories.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Categoria nu a fost găsită" }, { status: 404 });
    }

    if (existing[0].isSystemCategory) {
      return NextResponse.json(
        { error: "Categoriile sistem nu pot fi șterse" },
        { status: 403 }
      );
    }

    await db
      .delete(schema.categories)
      .where(and(eq(schema.categories.id, id), eq(schema.categories.userId, user.id)));

    return NextResponse.json({ message: "Categorie ștearsă cu succes" });
  } catch (error) {
    console.error("[CATEGORIES DELETE] Error:", error);
    return NextResponse.json({ error: "Eroare internă server" }, { status: 500 });
  }
}
